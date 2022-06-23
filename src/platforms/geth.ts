/* eslint-disable eqeqeq */
import { EthereumClient } from '../eth/client';
import { clientVersion, gethMemStats, gethMetrics, gethNodeInfo, gethPeers, gethTxpool } from '../eth/requests';
import { GethMemStats, GethMetrics, GethNodeInfoResponse, GethPeer } from '../eth/responses';
import { formatPendingTransaction } from '../core/format';
import { NodeInfo, PendingTransactionMessage, NodeMetricsMessage } from '../core/msgs';
import { OutputMessage } from '../core/output';
import { createModuleDebug } from '../utils/debug';
import { durationStringToMs, parseAbbreviatedNumber } from '../utils/parse';
import { captureDefaultMetrics, GenericNodeAdapter, checkRpcMethodSupport } from './generic';

const { debug, info, error } = createModuleDebug('platforms:geth');

type MetricsObj = { [k: string]: number | string | any[] | MetricsObj };

const uncapitalize = (s: string): string => s[0].toLowerCase() + s.slice(1);

function formatGenericMetrics(obj: MetricsObj, prefix: string): Array<{ name: string; value: number }> {
  return Object.entries(obj).flatMap(([name, value]) => {
    if (typeof value === 'number') {
      return { name: `${prefix}.${uncapitalize(name)}`, value };
    }
    if (typeof value === 'string') {
      // Check if value is in the form of "0 (0.00/s)" and parse the first value (and exclude the per-second rate)
      if (value.endsWith(')')) {
        const parts = value.split(' ');
        if (parts.length === 2) {
          const n = parseAbbreviatedNumber(parts[0]);
          if (n != null && !isNaN(n)) {
            return { name: `${prefix}.${uncapitalize(name)}`, value: n };
          }
        }
      }
      if (value.endsWith('s')) {
        const dur = durationStringToMs(value);
        if (!isNaN(dur)) {
          return { name: `${prefix}.${uncapitalize(name)}`, value: dur };
        }
      }
    }
    if (Array.isArray(value)) {
      return [];
    }
    if (typeof obj === 'object') {
      return formatGenericMetrics(value as MetricsObj, `${prefix}.${uncapitalize(name)}`);
    }
    return [];
  });
}

export function formatGethMetrics(metrics: GethMetrics): [string, number | undefined][] {
  return formatGenericMetrics(metrics, 'geth.metrics').map(({ name, value }) => [name, value]);
}

export function formatGethMemStats(memStats: GethMemStats): [string, number | undefined][] {
  const prefix = 'geth.memStats.';
  const { BySize: bySize, ...rest } = memStats;
  return Object.entries(rest)
    .filter(([, v]) => typeof v === 'number')
    .map(([name, value]) => [prefix + uncapitalize(name), value] as [string, number | undefined])
    .concat(
      bySize != null
        ? bySize.flatMap(s => [
            [`${prefix}bySize.${s.Size}.mallocs`, s.Mallocs],
            [`${prefix}bySize.${s.Size}.frees`, s.Frees],
          ])
        : [],
    );
}

export async function captureGethMetrics(
  ethClient: EthereumClient,
  captureTime: number,
  supports: { debugMetrics: boolean; memStats: boolean },
): Promise<NodeMetricsMessage | null> {
  if (!supports.debugMetrics && !supports.memStats) {
    return null;
  }
  const [metricsResults, memStatsResults] = await Promise.all([
    supports.debugMetrics ? ethClient.request(gethMetrics(true)) : null,
    supports.memStats ? ethClient.request(gethMemStats()) : null,
  ]);
  return {
    type: 'nodeMetrics',
    time: captureTime,
    metrics: Object.fromEntries([
      ...(metricsResults != null ? formatGethMetrics(metricsResults) : []),
      ...(memStatsResults != null ? formatGethMemStats(memStatsResults) : []),
    ]),
  };
}

export async function captureTxpoolData(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
  try {
    const txpool = await ethClient.request(gethTxpool());
    const pending = Object.values(txpool.pending).flatMap(o => Object.values(o).flat(1));
    const queued = Object.values(txpool.queued).flatMap(o => Object.values(o).flat(1));
    return [
      {
        type: 'nodeMetrics',
        time: captureTime,
        metrics: {
          pendingTransactionCount: pending.length,
          'geth.txpool.pending': pending.length,
          'geth.txpool.queued': queued.length,
        },
      },
      ...pending.map(
        tx =>
          ({
            type: 'pendingtx',
            time: captureTime,
            body: formatPendingTransaction(tx, 'pending'),
          } as PendingTransactionMessage),
      ),
      ...queued.map(
        tx =>
          ({
            type: 'pendingtx',
            time: captureTime,
            body: formatPendingTransaction(tx, 'queued'),
          } as PendingTransactionMessage),
      ),
    ];
  } catch (e) {
    error('Failed to retrive txpool data from geth node', e);
    return [];
  }
}

export async function capturePeers(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
  const peers = await ethClient.request(gethPeers());
  return peers.map((peer: GethPeer) => ({
    type: 'gethPeer',
    time: captureTime,
    body: peer,
  }));
}

export interface GethNodeInfo extends NodeInfo {
  gethInfo: GethNodeInfoResponse;
}

export class GethAdapter extends GenericNodeAdapter {
  protected gethNodeInfo?: GethNodeInfoResponse;

  protected gethSupports?: { debugMetrics: boolean; memStats: boolean };

  public async initialize(ethClient: EthereumClient) {
    await super.initialize(ethClient);
    debug('Determining support for geth-specific RPC methods');
    const [supportsDebugMetrics, supportsMemStats] = await Promise.all([
      checkRpcMethodSupport(ethClient, gethMetrics(true)),
      checkRpcMethodSupport(ethClient, gethMemStats()),
    ]);
    this.gethSupports = {
      debugMetrics: supportsDebugMetrics,
      memStats: supportsMemStats,
    };
    info('Determined support for geth-specific RPC methods: %o', this.gethSupports);
  }

  public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
    debug('Retrieving nodeInfo from geth node');
    const [baseNodeInfo, gethNodeInfoRes, clientVersionRes] = await Promise.all([
      super.captureNodeInfo(ethClient),
      ethClient.request(gethNodeInfo()),
      ethClient.request(clientVersion()),
    ]);
    return {
      ...baseNodeInfo,
      enode: gethNodeInfoRes.enode,
      clientVersion: clientVersionRes,
      network: this.network ?? null,
      platform: this.name,
      gethInfo: gethNodeInfoRes,
    };
  }

  public get name(): string {
    return 'geth';
  }

  public get enode(): string | null {
    return this.nodeInfo?.enode ?? null;
  }

  public async captureNodeMetrics(ethClient: EthereumClient, captureTime: number): Promise<NodeMetricsMessage[]> {
    const [defaultMetrics, _gethMetrics] = await Promise.all([
      captureDefaultMetrics(ethClient, captureTime),
      captureGethMetrics(ethClient, captureTime, this.gethSupports!),
    ]);
    return [defaultMetrics, _gethMetrics].filter(m => m != null) as NodeMetricsMessage[];
  }

  public async supportsPendingTransactions(ethClient: EthereumClient): Promise<boolean> {
    return await checkRpcMethodSupport(ethClient, gethTxpool());
  }

  public async capturePendingTransactions(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    return await captureTxpoolData(ethClient, captureTime);
  }

  public async supportsPeerInfo(ethClient: EthereumClient) {
    return await checkRpcMethodSupport(ethClient, gethPeers());
  }

  public async capturePeerInfo?(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    return await capturePeers(ethClient, captureTime);
  }
}
