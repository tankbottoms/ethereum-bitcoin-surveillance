import { EthereumProcessingOptions } from '../types';
import { BlockchainETLConfig } from './config';

export const simpleConfig = {
  debug: false,
  trace: false,
  healthCheck: false,
  printConfig: false,
  debugContractInfo: '',
  abi: '',
};

export const complexConfig: BlockchainETLConfig = {
  eth: {
    url: process.env.NODE_URL!,
    http: {},
    client: { maxBatchSize: 100, maxBatchTime: 100 },
  },
  output: {
    type: 'mongodb',
    sourcetypes: {
      block: 'ethereum:block',
      transaction: 'ethereum:transaction',
      event: 'ethereum:transaction:event',
      pendingtx: 'ethereum:transaction:pending',
      nodeInfo: 'ethereum:node:info',
      nodeMetrics: 'ethereum:node:metrics',
      gethPeer: 'ethereum:geth:peer',
      balance: 'ethereum:balance',
    },
  },
  hec: {
    default: {
      url: 'http://www.google.com',
    },
  },
  mongo: {
    default: {
      address: process.env.MONGO_HOST_IP ?? '192.168.1.3',
      port: process.env.MONGO_HOST_PORT ?? '27017',
    },
    events: {},
    metrics: {},
    internal: {},
  },
  checkpoint: {
    filename: 'checkpoints.json',
    saveInterval: 5000,
  },
  abi: {
    fingerprintContracts: true,
    requireContractMatch: false,
    decodeAnonymous: true,
    reconcileStructShapeFromTuples: true,
    abiFileExtension: 'json',
    directory: 'abi-input',
    searchRecursive: true,
  },
  contractInfo: {
    maxCacheEntries: 25_000,
  },
  blockWatcher: {
    blocksMaxChunkSize: 50,
    decryptPrivateTransactions: false,
    enabled: true,
    maxParallelChunks: 5,
    pollInterval: 10000,
    retryWaitTime: 2000,
    startAt: 16_000_000, // 'genesis'
  },
  nftWatchers: new Map(),
  balanceWatchers: new Map(),
  nodeMetrics: {
    collectInterval: 10000,
    enabled: true,
    retryWaitTime: 100,
  },
  nodeInfo: {
    collectInterval: 10000,
    enabled: true,
    retryWaitTime: 100,
  },
  pendingTx: {
    collectInterval: 5000,
    enabled: true,
    retryWaitTime: 100,
  },
  peerInfo: {
    collectInterval: 10_000,
    enabled: true,
    retryWaitTime: 100,
  },
  internalMetrics: {
    collectInterval: 10000,
    enabled: true,
  },
};

export function initConfig(options: EthereumProcessingOptions) {
  // supercede the otherwise configured value!
  console.log(`patching start block to ${options.start_block}`);
  complexConfig.blockWatcher.startAt = options.start_block ?? 'genesis';
}
