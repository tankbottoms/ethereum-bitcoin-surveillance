/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import AbortController from 'abort-controller';
import { HttpOptions } from 'agentkeepalive';
import { Db, MongoClient } from 'mongodb';
import { MongoConfig } from './config';
import { sleep } from '../utils/async';
import { createModuleDebug } from '../utils/debug';
import { exponentialBackoff, resolveWaitTime, retry, linearBackoff } from '../utils/retry';
import { AggregateMetric } from '../utils/stats';
import { deepMerge, removeEmtpyValues } from '../utils/obj';

const { debug, info, warn, error, trace } = createModuleDebug('mongo');

export const DATABASE_NAME_ETH = `eth-etl`;
export const NODE_INFO_COLLECTION = `node-info`;
export const PEERS_COLLECTION = `peer-collection`;
export const PENDING_TX_COLLECTION = `pending-tx`;
export const TRANSACTIONS_COLLECTION = `transactions`;
export const TRANSACTION_EVENT_COLLECTION = `tx-events`;
export const BLOCKS_COLLECTION = `blocks`;

/** Number of milliseconds since epoch */
export type EpochMillis = number;

export interface Metadata {
  host?: string;
  source?: string;
  sourcetype?: string;
  index?: string;
}

export type Fields = { [k: string]: any };

type ReshapedMongoMsg = {
  time: Date | EpochMillis;
  fields?: Fields;
  event?: string | { [k: string]: any };
  sourcetype?: string;
};

export interface Event {
  time: Date | EpochMillis;
  body: string | { [k: string]: any };
  fields?: Fields;
  metadata?: Metadata;
}

export interface Metric {
  time: Date | EpochMillis;
  name: string;
  value: number;
  fields?: Fields;
  metadata?: Metadata;
}

export interface MultiMetrics {
  time: Date | EpochMillis;
  measurements: { [name: string]: number | undefined };
  fields?: Fields;
  metadata?: Metadata;
}

export function serializeTime(time: Date | EpochMillis): number {
  if (time instanceof Date) {
    return +(time.getTime() / 1000).toFixed(3);
  }
  return +(time / 1000);
}

export function reshapeEvent(event: Event, defaultMetadata?: Metadata, defaultFields?: Fields) {
  return {
    time: serializeTime(event.time),
    event: event.body,
    fields: { ...defaultFields, ...event.fields },
    ...{ ...defaultMetadata, ...event.metadata },
  };
}

export function reshapeMetric(metric: Metric, defaultMetadata?: Metadata, defaultFields?: Fields) {
  return {
    time: serializeTime(metric.time),
    fields: {
      ...defaultFields,
      ...metric.fields,
      metric_name: metric.name,
      _value: metric.value,
    },
    ...{ ...defaultMetadata, ...metric.metadata },
  };
}

export function reshapeMetrics(metrics: MultiMetrics, defaultMetadata?: Metadata, defaultFields?: Fields) {
  const measurements = Object.fromEntries(
    Object.entries(metrics.measurements).map(([key, value]) => [`metric_name:${key}`, value]),
  );
  return {
    time: serializeTime(metrics.time),
    fields: {
      ...defaultFields,
      ...metrics.fields,
      ...measurements,
    },
    ...{ ...defaultMetadata, ...metrics.metadata },
  };
}

const CONFIG_DEFAULTS = {
  address: '',
  port: '',
  defaultMetadata: {},
  defaultFields: {},
  maxQueueEntries: -1,
  maxQueueSize: 512_000,
  flushTime: 0,
  gzip: true,
  maxRetries: Infinity,
  timeout: 30_000,
  requestKeepAlive: true,
  validateCertificate: true,
  maxSockets: 256,
  userAgent: 'eth-etl-mongo-client/1.0',
  retryWaitTime: exponentialBackoff({ min: 0, max: 180_000 }),
  multipleMetricFormatEnabled: false,
};

type CookedMongoConfig = Required<MongoConfig>;

export function parseMongoConfig(config: MongoConfig): CookedMongoConfig {
  const url = new URL(`http://${config.address}:${config.port}`!);
  if (url.pathname === '' || url.pathname === '/') {
    url.pathname = '/services/collector/event/1.0';
  }
  return {
    ...CONFIG_DEFAULTS,
    ...config,
    waitForAvailability: config.waitForAvailability ?? 0,
  };
}

class FlushHandle {
  public promise: Promise<void> | null = null;

  constructor(private abortController: AbortController) {}

  public cancel() {
    this.abortController.abort();
  }
}

export function isMetric(msg: Event | Metric): msg is Metric {
  return 'name' in msg && typeof msg.name !== 'undefined';
}

const initialCounters = {
  errorCount: 0,
  retryCount: 0,
  queuedMessages: 0,
  sentMessages: 0,
  queuedBytes: 0,
  sentBytes: 0,
  transferredBytes: 0,
};

export class MongoDBClient {
  public readonly config: CookedMongoConfig;
  private active: boolean = true;
  private queue: ReshapedMongoMsg[] = [];
  private queueSizeBytes: number = 0;
  private flushTimer: NodeJS.Timer | null = null;
  private activeFlushing: Set<FlushHandle> = new Set();
  private mongoClient: MongoClient;
  private counters = {
    ...initialCounters,
  };
  private aggregates = {
    requestDuration: new AggregateMetric(),
    batchSize: new AggregateMetric(),
    batchSizeBytes: new AggregateMetric(),
    batchSizeCompressed: new AggregateMetric(),
  };

  public constructor(config: MongoConfig) {
    this.config = parseMongoConfig(config);
    const agentOptions: HttpOptions = {
      keepAlive: this.config.requestKeepAlive,
      maxSockets: this.config.maxSockets,
      timeout: this.config.timeout,
    };
    this.mongoClient = new MongoClient(`mongodb://${config.address}:${config.port}`);
  }

  private async createCollectionIfNotExists(db: Db, name: string) {
    const collections = db.listCollections({ name: name });
    const c = await collections.next();
    if (!!c) {
      info(`${name} exists`);
    } else {
      info(`creating collection ${name}`);
      await db.createCollection(name);
    }
  }

  public async initMongoDB() {
    await this.mongoClient.connect();
    const db = this.mongoClient.db(`cs`);
    await this.createCollectionIfNotExists(db, 'blocks');
    await this.createCollectionIfNotExists(db, 'node-info');
    await this.createCollectionIfNotExists(db, 'peers');
    await this.createCollectionIfNotExists(db, 'pending-tx');
    await this.createCollectionIfNotExists(db, 'general-metrics');
    await this.createCollectionIfNotExists(db, 'geth-metrics');
    await this.createCollectionIfNotExists(db, 'internal-metrics');
    await this.createCollectionIfNotExists(db, 'syncing-metrics');
    await this.createCollectionIfNotExists(db, 'transactions');
    await this.createCollectionIfNotExists(db, 'tx-events');

    await db.collection('blocks').createIndex({ hash: 1 });
    await db.collection('node-info').createIndex({ enode: 1 });
    await db.collection('peers').createIndex({ id: 1 });
    await db.collection('pending-tx').createIndex({ hash: 1 });
    await db.collection('transactions').createIndex({ hash: 1 });
  }

  public clone(configOverrides?: Partial<MongoConfig>): MongoDBClient {
    debug('Cloning Mongo client with overrides %O', configOverrides);
    if (configOverrides == null || Object.keys(removeEmtpyValues(configOverrides)).length === 0) {
      debug('Reusing Mongo client for clone without any overrides');
      return this;
    }
    if (configOverrides?.address && configOverrides.address !== this.config.address) {
      debug('Creating new Mongo client with different address', configOverrides.address);
      return new MongoDBClient(deepMerge(this.config, configOverrides || {}));
    }
    debug('Creating new Mongo client instance but reusing HTTP agent and socket pool');
    const cloned = new MongoDBClient(deepMerge(this.config, configOverrides || {}));
    return cloned;
  }

  public push(msg: Event | Metric) {
    return isMetric(msg) ? this.pushMetric(msg) : this.pushEvent(msg);
  }

  public async pushEvent(event: Event) {
    const reshaped = reshapeEvent(event, this.config.defaultMetadata, this.config.defaultFields);
    await this.pushReshapedMsg(reshaped);
  }

  public async pushMetric(metric: Metric) {
    const reshaped = reshapeMetric(metric, this.config.defaultMetadata, this.config.defaultFields);
    await this.pushReshapedMsg(reshaped);
  }

  public async pushMetrics(metrics: MultiMetrics) {
    if (this.config.multipleMetricFormatEnabled) {
      const reshaped = reshapeMetrics(metrics, this.config.defaultMetadata, this.config.defaultFields);
      await this.pushReshapedMsg(reshaped);
    } else {
      const { measurements, ...rest } = metrics;
      for (const [name, value] of Object.entries(measurements)) {
        if (value != null) {
          await this.pushMetric({
            ...rest,
            name,
            value,
          });
        }
      }
    }
  }

  private async pushReshapedMsg(serialized: ReshapedMongoMsg) {
    if (!this.active) {
      throw new Error('Mongo client has been shut down');
    }
    this.counters.queuedMessages++;
    if (this.counters.queuedMessages + 1 > this.config.maxQueueEntries) {
      // debug(
      //     'Flushing Mongo queue as size limit would be exceeded by new message (queue size is %d messages)',
      //     this.counters.queuedMessages
      // );
      await this.flushInternal();
    }
    this.queue.push(serialized);
    await this.scheduleFlush();
  }

  public async flush(): Promise<void> {
    await Promise.all([...this.activeFlushing.values()].map(f => f.promise).concat(this.flushInternal()));
  }

  public get stats() {
    return {
      queueSize: this.queue.length,
      queueSizeBytes: this.queueSizeBytes,
      ...this.counters,
    };
  }

  public flushStats() {
    const stats = {
      ...this.counters,
      ...this.aggregates.requestDuration.flush('requestDuration'),
      ...this.aggregates.batchSize.flush('batchSize'),
      ...this.aggregates.batchSizeBytes.flush('batchSizeBytes'),
      ...this.aggregates.batchSizeCompressed.flush('batchSizeCompressed'),
      activeFlushingCount: this.activeFlushing.size,
    };
    this.counters = { ...initialCounters };
    return stats;
  }

  public async shutdown(maxTime?: number) {
    info('Shutting down Mongo client');
    this.active = false;
    if (maxTime != null && (this.activeFlushing.size > 0 || this.queue.length > 0)) {
      debug(`Waiting for ${this.activeFlushing.size} flush tasks to complete`);
      await Promise.race([sleep(maxTime), this.flush()]);
    }
    if (this.activeFlushing.size > 0) {
      debug(`Cancelling ${this.activeFlushing.size} flush tasks`);
      this.activeFlushing.forEach(f => f.cancel());
    }
  }

  public async checkAvailable(): Promise<void> {
    const url = new URL(`http://${this.config.address}:${this.config.port}`);
    url.pathname = '/services/collector/health';

    debug('Checking if Mongo is available at %s', url.href);
    try {
      // TODO : is mongo available?
    } catch (e) {
      debug('Mongo availability check failed', e);
      throw e;
    }
  }

  public async waitUntilAvailable(maxTime: number = 20_000) {
    const startTime = Date.now();
    debug('Checking Mongo service %s availability (timeout %d ms)', this.config.address, maxTime);
    let checkFailedOnce = false;
    await retry(
      () =>
        this.checkAvailable().catch(e =>
          Promise.reject(`Mongo service ${this.config.address} not available: ${e.toString()}`),
        ),
      {
        taskName: 'Mongo availablility',
        waitBetween: linearBackoff({ min: 500, step: 250, max: 2500 }),
        timeout: maxTime,
        onError: e => {
          if (!checkFailedOnce) {
            warn('Mongo service not (yet) available:', e);
            info('Waiting for Mongo service %s to become available (timeout %d ms)', this.config.address, maxTime);
            checkFailedOnce = true;
          }
        },
      },
    );
    if (checkFailedOnce) {
      info('Mongo service is now available after %d ms', Date.now() - startTime);
    }
  }

  private flushInternal = (): Promise<void> => {
    if (this.flushTimer != null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.queue.length === 0) {
      return Promise.resolve();
    }
    const queue = this.queue;
    this.queue = [];
    this.queueSizeBytes = 0;
    this.counters.queuedMessages = 0;

    const abortController = new AbortController();
    const flushHandle = new FlushHandle(abortController);
    const flushCompletePromise = this.sendToMongo(queue, abortController.signal);
    flushHandle.promise = flushCompletePromise;
    this.activeFlushing.add(flushHandle);

    const removeFromActive = () => this.activeFlushing.delete(flushHandle);
    flushCompletePromise.then(removeFromActive, removeFromActive);

    return flushCompletePromise;
  };

  private async sendToMongo(msgs: ReshapedMongoMsg[], abortSignal: AbortSignal): Promise<void> {
    const startTime = Date.now();
    //debug('Flushing Mongo queue with %s messages', msgs.length);

    const len = JSON.stringify(msgs).length;

    const rawBodySize = len;
    const bodySize = len;
    this.aggregates.batchSize.push(msgs.length);
    this.aggregates.batchSizeBytes.push(rawBodySize);
    let attempt = 0;

    while (true) {
      attempt++;
      try {
        const requestStart = Date.now();

        for (const msg of msgs) {
          if (msg.hasOwnProperty('event')) {
            debug(`sourceType ${msg.sourcetype}`);
            switch (msg.sourcetype) {
              case 'ethereum:node:info': {
                const body = msg.event as { enode: string; gethInfo?: { id: string } };
                const id = body.gethInfo?.id ?? body.enode;
                const filter = {
                  _id: id,
                };
                const update = {
                  ...body,
                  _id: id,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${NODE_INFO_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                  if (result.upsertedCount > 0) {
                    info(`node info upserted`);
                  }
                } catch (err) {
                  error(err);
                }
                break;
              }
              case 'ethereum:geth:peer': {
                const body = msg.event as { id: string };
                const id = body.id;

                const filter = {
                  _id: id,
                };
                const update = {
                  ...body,
                  _id: id,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${PEERS_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                  if (result.upsertedCount > 0) {
                    info(`peer data upserted`);
                  }
                } catch (err) {
                  error(err);
                }
                break;
              }
              case 'ethereum:block': {
                const body = msg.event as { hash: string };
                const hash = body.hash;

                const filter = {
                  _id: hash,
                };
                const update = {
                  ...body,
                  _id: hash,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${BLOCKS_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                  if (result.upsertedCount > 0) {
                    debug(`block upserted`);
                  }
                } catch (err) {
                  error(err);
                }
                break;
              }
              case 'ethereum:transaction:pending': {
                const body = msg.event as { hash: string };
                const hash = body.hash;
                //debug(`hash is ${hash}`);
                const filter = {
                  _id: hash,
                };
                const update = {
                  _id: hash,
                  ...body,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${PENDING_TX_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                  // if (result.upsertedCount > 0) {
                  //     debug(`pendingTx upserted`)
                  // }
                } catch (err) {
                  error(err);
                }
                break;
              }
              case 'ethereum:transaction': {
                const body = msg.event as { hash: string };
                const hash = body.hash;
                const filter = {
                  _id: hash,
                };
                const update = {
                  _id: hash,
                  ...body,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${TRANSACTIONS_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                } catch (err) {
                  error(err);
                }
                break;
              }
              case 'ethereum:transaction:event': {
                const body = msg.event as { transactionHash: string };
                const hash = body.transactionHash;
                const filter = {
                  _id: hash,
                };
                const update = {
                  _id: hash,
                  ...body,
                };
                try {
                  const result = await this.mongoClient
                    .db(`${DATABASE_NAME_ETH}`)
                    .collection(`${TRANSACTION_EVENT_COLLECTION}`)
                    .replaceOne(filter, update, { upsert: true });
                } catch (err) {
                  error(err);
                }
                break;
              }
              default: {
                info(`unknown sourceType %s`, msg.sourcetype);
                info(`${JSON.stringify(msg, null, 2)}`);
                process.exit(0);
              }
            }
          } else {
            const metric = msg as Metric;
            const metric_name = metric.fields?.metric_name as string;
            const internal_prefix = 'blockchainETL.internal.';
            const syncing_prefix = 'syncing.';
            const geth_prefix = 'geth.';
            if (metric_name.startsWith(internal_prefix)) {
              const name = metric_name.slice(internal_prefix.length);
              const value = metric.fields?._value;
              const filter = {
                _id: name,
              };
              const update = {
                _id: name,
                value,
              };
              try {
                const result = await this.mongoClient
                  .db('cs')
                  .collection('internalMetrics')
                  .replaceOne(filter, update, { upsert: true });
                debug(`internalMetrics upserted ${name} = ${value}`);
              } catch (err) {
                error(err);
              }
            } else if (metric_name.startsWith(syncing_prefix)) {
              const name = metric_name.slice(syncing_prefix.length);
              const value = metric.fields?._value;
              const filter = {
                _id: name,
              };
              const update = {
                _id: name,
                value,
              };
              try {
                const result = await this.mongoClient
                  .db('cs')
                  .collection('syncingMetrics')
                  .replaceOne(filter, update, { upsert: true });
                debug(`syncingMetrics upserted ${name} = ${value}`);
              } catch (err) {
                error(err);
              }
            } else if (metric_name.startsWith(geth_prefix)) {
              const name = metric_name.slice(geth_prefix.length);
              const value = metric.fields?._value;
              const filter = {
                _id: name,
              };
              const update = {
                _id: name,
                value,
              };
              try {
                const result = await this.mongoClient
                  .db('cs')
                  .collection('gethMetrics')
                  .replaceOne(filter, update, { upsert: true });
                debug(`gethMetrics upserted ${name} = ${value}`);
              } catch (err) {
                error(err);
              }
            } else {
              const name = metric_name;
              const value = metric.fields?._value;
              const filter = {
                _id: name,
              };
              const update = {
                _id: name,
                value,
              };
              try {
                const result = await this.mongoClient
                  .db('cs')
                  .collection('generalMetrics')
                  .replaceOne(filter, update, { upsert: true });
                debug(`generalMetrics upserted ${name} = ${value}`);
              } catch (err) {
                error(err);
              }
            }
          }
        }

        this.aggregates.requestDuration.push(Date.now() - requestStart);

        // if (!isSuccessfulStatus(response.status)) {
        //     if (debug.enabled) {
        //         try {
        //             const text = await response.text();
        //             debug(`Response from Mongo: %s`, text);
        //         } catch (e) {
        //             debug('Failed to retrieve text from Mongo response', e);
        //         }
        //     }
        //     throw new Error(`Mongo responded with status ${response.status}`);
        // }

        debug(
          'Successfully flushed %s Mongo messages in %s attempts and %s ms',
          msgs.length,
          attempt,
          Date.now() - startTime,
        );

        this.counters.sentMessages += msgs.length;
        this.counters.sentBytes += rawBodySize;
        this.counters.transferredBytes += bodySize;
        break;
      } catch (e) {
        this.counters.errorCount++;
        debug('Failed to send batch to Mongo (attempt %s)', attempt, e);
        error(
          'Failed to send batch to Mongo (attempt %s): %s',
          attempt,
          e instanceof Error ? e.message : 'general error',
        );
        if (abortSignal.aborted) {
          throw new Error('Aborted');
        }
        if (attempt <= this.config.maxRetries) {
          const retryDelay = resolveWaitTime(this.config.retryWaitTime, attempt);
          debug(`Retrying to send batch to Mongo in %d ms`, retryDelay);
          await sleep(retryDelay);
          if (abortSignal.aborted) {
            throw new Error('Aborted');
          }
          this.counters.retryCount++;
        }
      }
    }
  }

  private async scheduleFlush() {
    if (this.config.maxQueueEntries !== -1 && this.queue.length > this.config.maxQueueEntries) {
      debug('Flushing Mongo queue for entries limit being reached (%s entries)', this.queue.length);
      await this.flushInternal();
      return;
    }
    if (this.flushTimer == null) {
      this.flushTimer = setTimeout(async () => {
        debug('Flushing Mongo queue for time limit being reached');
        await this.flushInternal();
      }, this.config.flushTime ?? 0);
    }
  }

  private interpretMessage(metric: Metric) {
    switch (metric.fields?.metric_name) {
      case 'blockchainETL.internal.system.mem.rss': {
        debug(`mem.rss ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.mem.heapTotal': {
        debug(`mem.heapTotal ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.mem.heapUsed': {
        debug(`mem.heapUsed ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.mem.external': {
        debug(`mem.external ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.mem.arrayBuffers': {
        debug(`mem.arrayBuffers ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.cpu.user': {
        debug(`cpu.user ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.cpu.system': {
        debug(`cpu.system ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.wasm.memorySize': {
        debug(`wasm.memorySize ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.system.uptime': {
        debug(`system.uptime ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.requests': {
        debug(`ethTransport.requests ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.errors': {
        debug(`ethTransport.errors ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.requestDuration.count': {
        debug(`ethTransport.requestDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.requestDuration.sum': {
        debug(`ethTransport.requestDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.requestDuration.min': {
        debug(`ethTransport.requestDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.ethTransport.requestDuration.max': {
        debug(`ethTransport.requestDuration.max ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.requestDuration.avg': {
        debug(`ethTransport.requestDuration.avg ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.requestDuration.p99': {
        debug(`ethTransport.requestDuration.p99 ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.count': {
        debug(`ethTransport.batchSize.count ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.sum': {
        debug(`ethTransport.batchSize.sum ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.min': {
        debug(`ethTransport.batchSize.min ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.max': {
        debug(`ethTransport.batchSize.max ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.avg': {
        debug(`ethTransport.batchSize.avg ${metric.fields?._value}`);
        break;
      }

      case 'blockchainETL.internal.ethTransport.batchSize.p99': {
        debug(`ethTransport.batchSize.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.errorCount': {
        debug(`eventsMongo.errorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.retryCount': {
        debug(`eventsMongo.retryCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.queuedMessages': {
        debug(`eventsMongo.queuedMessages ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.sentMessages': {
        debug(`eventsMongo.sentMessages ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.queuedBytes': {
        debug(`eventsMongo.queuedBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.sentBytes': {
        debug(`eventsMongo.sentBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.transferredBytes': {
        debug(`eventsMongo.transferredBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.count': {
        debug(`eventsMongo.requestDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.count': {
        debug(`eventsMongo.batchSize.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.count': {
        debug(`eventsMongo.batchSizeBytes.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeCompressed.count': {
        debug(`eventsMongo.batchSizeCompressed.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.activeFlushingCount': {
        debug(`eventsMongo.activeFlushingCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.errorCount': {
        debug(`metricsMongo.errorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.retryCount': {
        debug(`metricsMongo.retryCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.queuedMessages': {
        debug(`metricsMongo.queuedMessages ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.sentMessages': {
        debug(`metricsMongo.sentMessages ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.queuedBytes': {
        debug(`metricsMongo.queuedBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.sentBytes': {
        debug(`metricsMongo.sentBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.transferredBytes': {
        debug(`metricsMongo.transferredBytes ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.requestDuration.count': {
        debug(`metricsMongo.requestDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.batchSize.count': {
        debug(`metricsMongo.batchSize.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.batchSizeBytes.count': {
        debug(`metricsMongo.batchSizeBytes.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.batchSizeCompressed.count': {
        debug(`metricsMongo.batchSizeCompressed.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.metricsMongo.activeFlushingCount': {
        debug(`metricsMongo.activeFlushingCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.contractInfoCache.hits': {
        debug(`contractInfoCache.hits ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.contractInfoCache.misses': {
        debug(`contractInfoCache.misses ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.contractInfoCache.size': {
        debug(`contractInfoCache.size ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.contractInfoCache.oldSize': {
        debug(`contractInfoCache.oldSize ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectCount': {
        debug(`nodeStatsCollector.infoCollectCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoErrorCount': {
        debug(`nodeStatsCollector.infoErrorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectCount': {
        debug(`nodeStatsCollector.metricsCollectCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsErrorCount': {
        debug(`nodeStatsCollector.metricsErrorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingTxCollectCount': {
        debug(`nodeStatsCollector.pendingTxCollectCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingTxErrorCount': {
        debug(`nodeStatsCollector.pendingTxErrorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectCount': {
        debug(`nodeStatsCollector.peerInfoCollectCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoErrorCount': {
        debug(`nodeStatsCollector.peerInfoErrorCount ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.count': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.count': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.count': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.count': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blocksParsed': {
        debug(`blockWatcher.blocksParsed ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blocksProcessed': {
        debug(`blockWatcher.blocksProcessed ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.transactionsProcessed': {
        debug(`blockWatcher.transactionsProcessed ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.transactionLogEventsProcessed': {
        debug(`blockWatcher.transactionLogEventsProcessed ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.count': {
        debug(`blockWatcher.blockProcessTime.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.txProcessTime.count': {
        debug(`blockWatcher.txProcessTime.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.eventProcessTime.count': {
        debug(`blockWatcher.eventProcessTime.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.abortHandles': {
        debug(`blockWatcher.abortHandles ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.': {
        debug(`blockWatcher.txProcessTime.count ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.sum': {
        debug(`eventsMongo.requestDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.min': {
        debug(`eventsMongo.requestDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.max': {
        debug(`eventsMongo.requestDuration.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.avg': {
        debug(`eventsMongo.requestDuration.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.requestDuration.p99': {
        debug(`eventsMongo.requestDuration.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.sum': {
        debug(`eventsMongo.batchSize.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.min': {
        debug(`eventsMongo.batchSize.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.max': {
        debug(`eventsMongo.batchSize.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.avg': {
        debug(`eventsMongo.batchSize.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSize.p99': {
        debug(`eventsMongo.batchSize.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.sum': {
        debug(`eventsMongo.batchSizeBytes.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.min': {
        debug(`eventsMongo.batchSizeBytes.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.max': {
        debug(`eventsMongo.batchSizeBytes.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.avg': {
        debug(`eventsMongo.batchSizeBytes.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.output.eventsMongo.batchSizeBytes.p99': {
        debug(`eventsMongo.batchSizeBytes.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.sum': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.min': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.max': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.avg': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.infoCollectDuration.infoCollectDuration.p99': {
        debug(`nodeStatsCollector.infoCollectDuration.infoCollectDuration.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.sum': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.min': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.max': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.avg': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.p99': {
        debug(`nodeStatsCollector.metricsCollectDuration.metricsCollectDuration.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.sum': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.avg': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.min': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.max': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.p99': {
        debug(`nodeStatsCollector.peerInfoCollectDuration.peerInfoCollectDuration.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.sum': {
        debug(`blockWatcher.blockProcessTime.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.avg': {
        debug(`blockWatcher.blockProcessTime.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.min': {
        debug(`blockWatcher.blockProcessTime.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.max': {
        debug(`blockWatcher.blockProcessTime.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.blockWatcher.blockProcessTime.p99': {
        debug(`blockWatcher.blockProcessTime.p99 ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.sum': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingCollectDuration.sum ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.avg': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingCollectDuration.avg ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.max': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingCollectDuration.max ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.min': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingCollectDuration.min ${metric.fields?._value}`);
        break;
      }
      case 'blockchainETL.internal.nodeStatsCollector.pendingtxCollectDuration.pendingtxCollectDuration.p99': {
        debug(`nodeStatsCollector.pendingtxCollectDuration.pendingCollectDuration.p99 ${metric.fields?._value}`);
        break;
      }

      case 'blockNumber': {
        debug(`blockNumber ${metric.fields?._value}`);
        break;
      }
      case 'hashRate': {
        debug(`hashRate ${metric.fields?._value}`);
        break;
      }
      case 'peerCount': {
        debug(`peerCount ${metric.fields?._value}`);
        break;
      }
      case 'gasPrice': {
        debug(`gasPrice ${metric.fields?._value}`);
        break;
      }
      case 'pendingTransactionCount': {
        debug(`pendingTransactionCount ${metric.fields?._value}`);
        break;
      }

      case 'syncing.currentBlock': {
        debug(`syncing.currentBlock ${metric.fields?._value}`);
        break;
      }
      case 'syncing.highestBlock': {
        debug(`syncing.highestBlock ${metric.fields?._value}`);
        break;
      }
      case 'syncing.knownStates': {
        debug(`syncing.knownStates ${metric.fields?._value}`);
        break;
      }
      case 'syncing.pulledStates': {
        debug(`syncing.pulledStates ${metric.fields?._value}`);
        break;
      }
      case 'syncing.startingBlock': {
        debug(`syncing.startingBlock ${metric.fields?._value}`);
        break;
      }

      case 'geth.txpool.pending': {
        debug(`geth.txpool.pending ${metric.fields?._value}`);
        break;
      }
      case 'geth.txpool.queued': {
        debug(`geth.txpool.queued ${metric.fields?._value}`);
        break;
      }
      case 'geth.memStats.totalAlloc': {
        debug(`geth.memStats.totalAlloc ${metric.fields?._value}`);
        break;
      }
      default: {
        error(`Unknown msg: %s`, JSON.stringify(metric));
        // process.exit(0);
      }
    }
  }
}
