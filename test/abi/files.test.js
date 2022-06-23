"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("../../src/abi/files");
const path_1 = require("path");
describe('loadAbiFile', () => {
    it('loads raw ABI file', async () => {
        const result = await (0, files_1.loadAbiFile)((0, path_1.join)(__dirname, '../abis/BCB.json'), {
            decodeAnonymous: false,
            fingerprintContracts: true,
            directory: (0, path_1.join)(__dirname, '../abis'),
            requireContractMatch: true,
            reconcileStructShapeFromTuples: false,
        });
        expect(result).toMatchSnapshot();
    });
    it('loads truffle build file', async () => {
        await expect((0, files_1.loadAbiFile)((0, path_1.join)(__dirname, '../abis/Airdropper.json'), {
            decodeAnonymous: false,
            fingerprintContracts: true,
            directory: (0, path_1.join)(__dirname, '..'),
            requireContractMatch: true,
            reconcileStructShapeFromTuples: false,
        })).resolves.toMatchSnapshot();
    });
    it('loads EventEmitter.json', async () => {
        await expect((0, files_1.loadAbiFile)((0, path_1.join)(__dirname, '../abis/EventEmitter.json'), {
            decodeAnonymous: false,
            fingerprintContracts: true,
            directory: (0, path_1.join)(__dirname, '..'),
            requireContractMatch: true,
            reconcileStructShapeFromTuples: false,
        })).resolves.toMatchSnapshot();
    });
});
