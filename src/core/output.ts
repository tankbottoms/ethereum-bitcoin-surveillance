import { BlockchainETLConfig, HecOutputConfig, MongoOutputConfig } from './config';
import { HecClient } from './hec';
import {
  BalanceMessage,
  BlockMessage,
  GethPeerMessage,
  LogEventMessage,
  NftMessage,
  NodeInfoMessage,
  NodeMetricsMessage,
  PendingTransactionMessage,
  TransactionMessage,
} from './msgs';
import { createDebug } from '../utils/debug';
import { prefixKeys } from '../utils/obj';
import { ManagedResource } from '../utils/resource';
import { Stats } from '../utils/stats';
import { MongoDBClient } from './mongo';
import { debug } from 'console';

export const defaultSourcetypes = {
  block: 'ethereum:block',
  transaction: 'ethereum:transaction',
  event: 'ethereum:transaction:event',
  pendingtx: 'ethereum:transaction:pending',
  nodeInfo: 'ethereum:node:info',
  nodeMetrics: 'ethereum:node:metrics',
  gethPeer: 'ethereum:geth:peer',
  balance: 'ethereum:balance',
  nft: 'ethereum:nft',
};

export type OutputMessage =
  | BlockMessage
  | TransactionMessage
  | PendingTransactionMessage
  | LogEventMessage
  | NodeInfoMessage
  | NodeMetricsMessage
  | GethPeerMessage
  | BalanceMessage
  | NftMessage;

export interface Output extends ManagedResource {
  write(message: OutputMessage): void;
  flushStats(): Stats;
  waitUntilAvailable?(maxTime: number): Promise<void>;
}

export class HecOutput implements Output, ManagedResource {
  constructor(private eventsHec: HecClient, private metricsHec: HecClient, private config: HecOutputConfig) {}

  public async write(msg: OutputMessage) {
    switch (msg.type) {
      case 'block':
      case 'transaction':
      case 'event':
      case 'pendingtx':
      case 'nodeInfo':
      case 'gethPeer':
      case 'balance':
      case 'nft':
        await this.eventsHec.pushEvent({
          time: msg.time,
          body: msg.body,
          metadata: {
            sourcetype: this.config.sourcetypes[msg.type] ?? defaultSourcetypes[msg.type],
          },
        });
        break;
      case 'nodeMetrics':
        const metricsPrefix = this.config.metricsPrefix ? this.config.metricsPrefix + '.' : '';
        await this.metricsHec.pushMetrics({
          time: msg.time,
          measurements: prefixKeys(msg.metrics, metricsPrefix, true),
          metadata: {
            sourcetype: this.config.sourcetypes.nodeMetrics ?? defaultSourcetypes.nodeMetrics,
          },
        });
        break;
      default:
        throw new Error(`Unrecognized output message: ${msg}`);
    }
  }

  public waitUntilAvailable(maxTime: number): Promise<void> {
    if (this.eventsHec === this.metricsHec || this.eventsHec.config.url === this.metricsHec.config.url) {
      return this.eventsHec.waitUntilAvailable(maxTime);
    }
    return Promise.all([this.eventsHec.waitUntilAvailable(maxTime), this.metricsHec.waitUntilAvailable(maxTime)]).then(
      () => Promise.resolve(),
    );
  }

  public flushStats() {
    return {
      ...prefixKeys(this.eventsHec.flushStats(), 'eventsHec.'),
      ...prefixKeys(this.metricsHec.flushStats(), 'metricsHec.'),
    };
  }

  public shutdown() {
    return Promise.all([this.eventsHec.shutdown(), this.metricsHec.shutdown()]).then(() => {
      /* noop */
    });
  }
}

export class MongoOutput implements Output, ManagedResource {
  constructor(
    private eventsMongo: MongoDBClient,
    private metricsMongo: MongoDBClient,
    private config: MongoOutputConfig,
  ) {}
  public async write(msg: OutputMessage) {
    switch (msg.type) {
      case 'block':
      case 'transaction':
      case 'event':
      case 'pendingtx':
      case 'nodeInfo':
      case 'gethPeer':
      case 'balance':
      case 'nft':
        await this.eventsMongo.pushEvent({
          time: msg.time,
          body: msg.body,
          metadata: {
            sourcetype: this.config.sourcetypes[msg.type] ?? defaultSourcetypes[msg.type],
          },
        });
        break;
      case 'nodeMetrics':
        const metricsPrefix = '';
        await this.eventsMongo.pushMetrics({
          time: msg.time,
          measurements: prefixKeys(msg.metrics, metricsPrefix, true),
          metadata: {
            sourcetype: this.config.sourcetypes.nodeMetrics ?? defaultSourcetypes.nodeMetrics,
          },
        });
        break;
      default:
        throw new Error(`Unrecognized output message: ${msg}`);
    }
  }

  public waitUntilAvailable(maxTime: number): Promise<void> {
    if (
      this.eventsMongo === this.metricsMongo ||
      this.eventsMongo.config.address === this.metricsMongo.config.address
    ) {
      return this.eventsMongo.waitUntilAvailable(maxTime);
    }
    return Promise.all([
      this.eventsMongo.waitUntilAvailable(maxTime),
      this.metricsMongo.waitUntilAvailable(maxTime),
    ]).then(() => Promise.resolve());
  }

  public flushStats() {
    return {
      ...prefixKeys(this.eventsMongo.flushStats(), 'eventsMongo.'),
      ...prefixKeys(this.metricsMongo.flushStats(), 'metricsMongo.'),
    };
  }

  public shutdown() {
    return Promise.all([this.eventsMongo.shutdown(), this.metricsMongo.shutdown()]).then(() => {
      /* noop */
    });
  }
}

export class FileOutput implements Output {
  write() {
    // TODO
  }

  public flushStats() {
    return {};
  }

  public async shutdown() {
    // noop
  }
}

export class ConsoleOutput implements Output {
  private readonly consoleOutput = createDebug('output');

  constructor() {
    this.consoleOutput.enabled = true;
  }

  write(msg: OutputMessage) {
    this.consoleOutput('%O', msg);
  }

  public flushStats() {
    return {};
  }

  public async shutdown() {
    // noop
  }
}

export class DevNullOutput implements Output {
  write() {
    // noop
  }

  public flushStats() {
    return {};
  }

  public async shutdown() {
    // noop
  }
}

export async function createOutput(
  config: BlockchainETLConfig,
  baseHecClient: HecClient,
  baseMongoClient: MongoDBClient,
): Promise<Output> {
  if (config.output.type === 'hec') {
    debug(`creating hec output`);
    const eventsHec = config.hec.events ? baseHecClient.clone(config.hec.events) : baseHecClient;
    const metricsHec = config.hec.metrics ? baseHecClient.clone(config.hec.metrics) : baseHecClient;
    const hecOutput = new HecOutput(eventsHec, metricsHec, config.output);
    const maxWaitTime = Math.max(eventsHec.config.waitForAvailability ?? 0, metricsHec.config.waitForAvailability ?? 0);
    if (maxWaitTime > 0) {
      await hecOutput.waitUntilAvailable(maxWaitTime);
    }
    return hecOutput;
  } else if (config.output.type === 'mongodb') {
    const eventsMongo = config.mongo.events ? baseMongoClient.clone(config.mongo.events) : baseMongoClient;
    const metricsMongo = config.mongo.metrics ? baseMongoClient.clone(config.mongo.metrics) : baseMongoClient;
    return new MongoOutput(eventsMongo, metricsMongo, config.output);
  } else if (config.output.type === 'console') {
    return new ConsoleOutput();
  } else if (config.output.type === 'file') {
    return new FileOutput();
  } else if (config.output.type === 'null') {
    return new DevNullOutput();
  }
  throw new Error(`Invalid output type: ${((config.output as any) ?? {}).type}`);
}
