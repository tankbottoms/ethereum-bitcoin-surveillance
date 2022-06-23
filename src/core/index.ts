import { Command } from '@oclif/command';
import debugModule from 'debug';
import { inspect } from 'util';
import { ContractInfo, getContractInfo } from '../abi/contract';
import { AbiRepository } from '../abi/repo';
import { BlockWatcher } from './blockwatcher';
import { State } from './state';
import { CLI_FLAGS } from './cliflags';
import { ConfigError, BlockchainETLConfig, loadBlockchainETLConfig } from './config';
import { BatchedEthereumClient, EthereumClient } from '../eth/client';
import { HttpTransport } from '../eth/http';
import { checkHealthState, HealthStateMonitor } from './health';
import { HecClient } from './hec';
import { introspectTargetNodePlatform } from './introspect';
import { substituteVariablesInHecConfig } from './meta';
import { NodeStatsCollector } from './nodestats';
import { createOutput } from './output';
import { ABORT } from '../utils/abort';
import { createModuleDebug, enableTraceLogging } from '../utils/debug';
import { LRUCache } from '../utils/lru';
import { ManagedResource, shutdownAll } from '../utils/resource';
import { waitForSignal } from '../utils/signal';
import { InternalStatsCollector } from '../utils/stats';
import { BalanceWatcher } from './balancewatcher';
import { simpleConfig, complexConfig } from './simple-config';
import { logger } from '../utils';
import { MongoDBClient } from './mongo';
import { NFTWatcher } from './nftwatcher';

const { debug, error, info } = createModuleDebug('cli');

class BlockchainETL {
  static description =
    'eth-etl is an agent to gather metrics and blockchain information from an Ethereum node ' +
    'and ingest it in Splunk via its HTTP Event Collector. It is part of Splunk Connect for Ethereum.';
  static usage = '--rpc-url=<rpc-url> [options]';
  static flags = CLI_FLAGS;

  private resources: ManagedResource[] = [];

  async run() {
    // eslint-disable-next-line eqeqeq
    if (process.env.CRYP_SURV_GIT_COMMIT != null) {
      //this.config.userAgent = `${this.config.userAgent} git-sha=${process.env.CRYP_SURV_GIT_COMMIT}`;
    }
    // const { flags } = this.parse(BlockchainETL);

    if (simpleConfig.debug) {
      debugModule.enable('eth-etl:*');
      debug('Enabled debug logging for eth-etl');
    }
    if (simpleConfig.trace) {
      enableTraceLogging();
    }
    if (simpleConfig.healthCheck) {
      const healthy = await checkHealthState();
      if (healthy) {
        info('eth-etl process appears to be healthy');
        process.exit(0);
      } else {
        error('eth-etl process is unhealthy');
        process.exit(1);
      }
    }

    try {
      if (simpleConfig.printConfig) {
        // const cfg = await loadBlockchainETLConfig(flags, true);
        debug('Printing config');
        // eslint-disable-next-line no-console
        // console.log(inspect(cfg, { depth: 10, colors: true, showHidden: false, compact: false }));
        // await loadBlockchainETLConfig(flags);
        return;
      }
      // const config = await loadBlockchainETLConfig(flags);

      // eslint-disable-next-line eqeqeq
      if (simpleConfig.debugContractInfo !== '') {
        const addr = simpleConfig.debugContractInfo;
        info(`Determining info for contract at address=%s`, addr);
        enableTraceLogging('eth-etl:abi:*');
        const abiRepo = new AbiRepository(complexConfig.abi);
        await abiRepo.initialize();
        const transport = new HttpTransport(complexConfig.eth.url, complexConfig.eth.http);
        const client = new EthereumClient(transport);
        const contractInfo = await getContractInfo(
          addr,
          client,
          (sig: string) => abiRepo.getMatchingSignature(sig),
          (address: string, fingerprint: string) =>
            abiRepo.getContractByAddress(address)?.contractName ??
            abiRepo.getContractByFingerprint(fingerprint)?.contractName,
        );

        info('Contract info: %O', contractInfo);
        return;
      }

      const health = new HealthStateMonitor();
      health.start();
      this.resources.push(health);

      //info('Starting eth-etl version=%s', this.config.userAgent);

      // Run eth-etl until we receive ctrl+c or hit an unrecoverable error
      await Promise.race([this.startBlockchainETL(complexConfig), waitForSignal('SIGINT'), waitForSignal('SIGTERM')]);

      info('Received signal, proceeding with shutdown sequence');
      const cleanShutdown = await shutdownAll(this.resources, 10_000);
      info('Shutdown complete.');
      process.exit(cleanShutdown ? 0 : 2);
    } catch (e) {
      if (!(e instanceof ConfigError)) {
        error('FATAL:', e);
      }
      if (e instanceof Error) {
        logger.error(e.message);
        process.exit(1);
      } else {
        logger.error('general error');
        process.exit(1);
      }
    } finally {
      await shutdownAll(this.resources, 10_000).catch(e => {
        error('Failed to shut down resources', e);
      });
    }
  }

  async startBlockchainETL(config: BlockchainETLConfig): Promise<any> {
    const addResource = <R extends ManagedResource>(r: R): R => {
      this.resources.unshift(r);
      return r;
    };

    const transport = new HttpTransport(config.eth.url, config.eth.http);
    const client =
      config.eth.client.maxBatchSize > 1
        ? new BatchedEthereumClient(transport, {
            maxBatchSize: config.eth.client.maxBatchSize,
            maxBatchTime: config.eth.client.maxBatchTime,
          })
        : new EthereumClient(transport);
    const platformAdapter = await introspectTargetNodePlatform(client, config.eth.chain, config.eth.network);

    info(
      'Detected node platform=%o protocol=%d chainId=%d networkId=%d chain=%s network=%s',
      platformAdapter.name,
      platformAdapter.protocolVersion,
      platformAdapter.chainId,
      platformAdapter.networkId,
      platformAdapter.networkName,
      platformAdapter.chainName,
    );

    substituteVariablesInHecConfig(config, {
      blockchainETLVersion: /*this.config.version*/ '1.0',
      platformAdapter,
      transportOriginHost: transport.originHost,
    });

    const baseHec = new HecClient(config.hec.default);
    const baseMongo = new MongoDBClient(config.mongo.default);
    await baseMongo.initMongoDB();
    const output = await createOutput(config, baseHec, baseMongo);
    addResource(output);

    const internalStatsCollector = new InternalStatsCollector({
      collect: config.internalMetrics.enabled,
      collectInterval: config.internalMetrics.collectInterval,
      dest: baseMongo.clone(config.mongo.internal),
      basePrefix: 'blockchainETL.internal',
    });
    addResource(internalStatsCollector);
    internalStatsCollector.addSource(transport, 'ethTransport');
    internalStatsCollector.addSource(output, 'output');

    const state = new State({
      path: config.checkpoint.filename,
      saveInterval: config.checkpoint.saveInterval,
    });
    const checkpoints = addResource(state);
    await checkpoints.initialize();

    const abiRepo = new AbiRepository(config.abi);
    addResource(abiRepo);
    await abiRepo.initialize();

    const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({
      maxSize: config.contractInfo.maxCacheEntries,
    });
    internalStatsCollector.addSource(contractInfoCache, 'contractInfoCache');

    const nodeStatsCollector = new NodeStatsCollector({
      ethClient: client,
      platformAdapter,
      output,
      nodeMetrics: config.nodeMetrics,
      nodeInfo: config.nodeInfo,
      pendingTx: config.pendingTx,
      peerInfo: config.peerInfo,
    });
    addResource(nodeStatsCollector);
    internalStatsCollector.addSource(nodeStatsCollector, 'nodeStatsCollector');

    let blockWatcher: BlockWatcher | null = null;

    if (config.blockWatcher.enabled) {
      blockWatcher = new BlockWatcher({
        checkpoint: state.getCheckpoint('main'),
        ethClient: client,
        output,
        abiRepo: abiRepo,
        config: config.blockWatcher,
        contractInfoCache,
        nodePlatform: platformAdapter,
      });
      addResource(blockWatcher);
      internalStatsCollector.addSource(blockWatcher, 'blockWatcher');
    } else {
      debug('Block watcher is disabled');
    }
    const balanceWatcherResources = [];

    for (const [name, balanceWatcherConfig] of config.balanceWatchers) {
      if (balanceWatcherConfig.enabled) {
        const balanceWatcher = new BalanceWatcher({
          checkpoint: state.getCheckpoint(name),
          ethClient: client,
          output,
          config: balanceWatcherConfig,
          contractInfoCache,
          nodePlatform: platformAdapter,
        });
        addResource(balanceWatcher);
        internalStatsCollector.addSource(balanceWatcher, 'balanceWatcher-' + name);
        balanceWatcherResources.push(balanceWatcher);
      }
    }

    const nftWatcherResources = [];

    for (const [name, nftWatcherConfig] of config.nftWatchers) {
      if (nftWatcherConfig.enabled) {
        const nftWatcher = new NFTWatcher({
          checkpoint: state.getCheckpoint(name),
          ethClient: client,
          output,
          config: nftWatcherConfig,
          contractInfoCache,
          nodePlatform: platformAdapter,
        });
        addResource(nftWatcher);
        internalStatsCollector.addSource(nftWatcher, 'nftWatcher-' + name);
        nftWatcherResources.push(nftWatcher);
      }
    }

    internalStatsCollector.start();

    return Promise.all(
      [
        blockWatcher?.start(),
        nodeStatsCollector.start(),
        ...balanceWatcherResources.map(b => b.start()),
        ...nftWatcherResources.map(b => b.start()),
      ].map(p =>
        p?.catch(e => {
          if (e !== ABORT) {
            error('Error in eth-etl task:', e);
            return Promise.reject(e);
          }
        }),
      ),
    );
  }
}

export = BlockchainETL;
