/* eslint-disable eqeqeq */
import { readdir, readFile, stat, createReadStream } from 'fs-extra';
import { basename, join as joinPath, resolve } from 'path';
import { AbiRepositoryConfig } from '../core/config';
import { Address } from '../core/msgs';
import { createModuleDebug, TRACE_ENABLED } from '../utils/debug';
import { AbiItemDefinition, AbiItem } from './item';
import { computeContractFingerprint } from './contract';
import { computeSignature } from './signature';
import { createGunzip } from 'zlib';
import BufferList from 'bl';
import { RuntimeError } from '../utils/error';

const { debug, warn, trace } = createModuleDebug('abi:files');

export class AbiError extends RuntimeError {}

interface TruffleBuild {
    contractName: string;
    abi: AbiItem[];
    networks?: {
        [id: string]: {
            address: string;
        };
    };
}

export interface SignatureFileContents {
    type: 'function' | 'event';
    entries: Array<[string, AbiItemDefinition[]]>;
}

export function isAbiItem(obj: any): obj is AbiItem {
    return typeof obj.type === 'string';
}

export function isAbiItemArray(obj: any): obj is AbiItem[] {
    return Array.isArray(obj) && obj.every(isAbiItem);
}

export function isTruffleBuildFile(obj: any): obj is TruffleBuild {
    return typeof obj === 'object' && isAbiItemArray(obj.abi);
}

export function extractDeployedContractAddresses(truffleBuild: TruffleBuild): Address[] | undefined {
    if (truffleBuild.networks) {
        return Object.values(truffleBuild.networks)
            .filter(({ address }) => address != null)
            .map(({ address }) => address.toLowerCase());
    }
}

export async function* searchAbiFiles(dir: string, config: AbiRepositoryConfig): AsyncIterable<string> {
    debug('Searching for ABI files in %s', dir);
    const dirContents = await readdir(dir).catch((e:any) =>
        Promise.reject(new AbiError(`Failed to load ABIs from directory ${dir}: ${e}`))
    );
    dirContents.sort();
    const subdirs = [];
    for (const f of dirContents) {
        const full = joinPath(dir, f);
        const s = await stat(full);
        if (s.isDirectory() && (config.searchRecursive ?? true)) {
            subdirs.push(joinPath(dir, f));
        } else if (s.isFile() && f.endsWith(config.abiFileExtension ?? '.json')) {
            yield full;
        }
    }
    for (const sub of subdirs) {
        yield* searchAbiFiles(sub, config);
    }
}

export interface AbiFileContents {
    contractName: string;
    contractAddress?: string;
    contractFingerprint?: string;
    entries: Array<{
        abi: AbiItemDefinition;
        sig: string;
    }>;
    fileName?: string;
}

export function computeRelativePath(fileName: string, basePath?: string): string | null {
    if (basePath != null) {
        const resolvedBased = resolve(basePath);
        const resolvedFileName = resolve(fileName);
        if (resolvedFileName.startsWith(resolvedBased)) {
            return resolvedFileName.slice(resolvedBased.length + 1);
        }
    }
    return null;
}

export function parseAbiFileContents(
    abiData: any,
    { computeFingerprint, fileName, basePath }: { computeFingerprint: boolean; fileName: string; basePath?: string }
): AbiFileContents {
    let abis: AbiItem[];
    let contractName: string;
    let contractAddress: string | undefined;
    debug('Parsing contents of ABI file %s', fileName);
    if (isTruffleBuildFile(abiData)) {
        debug('ABI file contains truffle build output');
        abis = abiData.abi;
        contractName =
            abiData.contractName ||
            // Fall back to file name without file extension
            basename(fileName).split('.', 1)[0];
        const addresses = extractDeployedContractAddresses(abiData);
        if (addresses != null) {
            if (addresses.length > 1) {
                warn(
                    'Found contract %s deployed to multiple (%d) networks, using address %s of first network',
                    contractName,
                    addresses.length,
                    addresses[0]
                );
            }
            contractAddress = addresses[0];
        }
    } else if (isAbiItemArray(abiData)) {
        abis = abiData;
        contractName = basename(fileName).split('.', 1)[0];
    } else {
        throw new AbiError(`Invalid contents of ABI file ${fileName}`);
    }

    const entries = abis
        .filter(abi => (abi.type === 'function' || abi.type === 'event') && abi.name != null)
        .map(abi => ({
            abi,
            sig: computeSignature({ name: abi.name!, inputs: abi.inputs ?? [], type: 'function' }),
        }));

    let contractFingerprint: string | undefined;
    if (computeFingerprint) {
        const functions = entries
            .filter(i => i.abi.type === 'function')
            .map(i => i.sig)
            .sort();
        const events = entries
            .filter(i => i.abi.type === 'event')
            .map(i => i.sig)
            .sort();

        contractFingerprint = computeContractFingerprint({ functions, events });
        if (TRACE_ENABLED) {
            trace(
                'Computed contract fingerprint %s for contract signature %s contents %O',
                contractFingerprint,
                contractName,
                { functions, events }
            );
        } else {
            debug('Computed contract fingerprint %s for contract signature %s', contractFingerprint, contractName);
        }
    }

    return {
        contractName,
        contractAddress,
        contractFingerprint: contractFingerprint,
        entries: entries.map(item => ({
            sig: item.sig,
            abi: {
                name: item.abi.name!,
                type: item.abi.type as 'function' | 'event',
                inputs: item.abi.inputs ?? [],
                contractName,
                contractFingerprint,
                contractAddress,
            },
        })),
        fileName: computeRelativePath(fileName, basePath) ?? basename(fileName),
    };
}

export async function loadAbiFile(path: string, config: AbiRepositoryConfig): Promise<AbiFileContents> {
    const contents = await readFile(path, { encoding: 'utf-8' });
    const data = JSON.parse(contents);
    return await parseAbiFileContents(data, {
        fileName: path,
        computeFingerprint: config.fingerprintContracts,
        basePath: config.directory,
    });
}

export async function readGzipFile(path: string, { encoding = 'utf-8' }: { encoding?: string } = {}): Promise<string> {
    return new Promise((_resolve, reject) => {
        const result = new BufferList();
        createReadStream(path)
            .pipe(createGunzip())
            .on('data', (chunk:any) => {
                result.append(chunk);
            })
            .on('end', () => {
                _resolve(result.toString(encoding));
            })
            .on('error', (e:any) => {
                reject(e);
            });
    });
}

export async function loadSignatureFile(path: string): Promise<SignatureFileContents> {
    const contents = await readGzipFile(path);
    return JSON.parse(contents);
}
