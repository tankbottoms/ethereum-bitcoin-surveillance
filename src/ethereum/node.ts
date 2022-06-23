import Web3 from 'web3';
import Bottleneck from 'bottleneck';
import { Web3Helper, Web3ProviderType } from './web3';
import { WebsocketProvider, provider } from 'web3-core';
import { logger } from '../utils';

const VERBOSE = true;
// @ts-ignore
type Dynamic = { [k: string]: any };

export class EthereumNode {
  private static instance: EthereumNode;
  private static genesis_block: string = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3';
  private static web3: Web3 | undefined = undefined;
  private static block_height: number | undefined;
  private static max_concurrent: number = 15;
  private static min_time: number = 500;
  private static limiter: Bottleneck | undefined = undefined;
  private static pending_mempool = {};
  private static node_info: string | undefined;

  //   private constructor() {}

  public static getInstance = async (max_concurrent?: number, min_time?: number): Promise<EthereumNode> => {
    if (!EthereumNode.instance) {
      EthereumNode.instance = new EthereumNode();
      logger.debug(`ethereum node initialization`);
      max_concurrent !== undefined ? (EthereumNode.max_concurrent = max_concurrent) : null;
      min_time !== undefined ? (EthereumNode.min_time = min_time) : null;
      max_concurrent !== undefined || min_time !== undefined
        ? (EthereumNode.limiter = new Bottleneck({
            maxConcurrent: EthereumNode.max_concurrent,
            minTime: EthereumNode.min_time,
          }))
        : (EthereumNode.limiter = new Bottleneck({
            maxConcurrent: EthereumNode.max_concurrent,
            minTime: EthereumNode.min_time,
          }));
      await EthereumNode.limiter.ready();
      await EthereumNode.connect(Web3ProviderType.InfuraHttp);
      return EthereumNode.instance;
    }
    return EthereumNode.instance;
  };

  public static connect = async (type?: Web3ProviderType) => {
    !EthereumNode.web3
      ? type !== undefined
        ? (EthereumNode.web3 = Web3Helper.connectWeb3(type))
        : (EthereumNode.web3 = Web3Helper.connectWeb3(Web3ProviderType.InfuraWs))
      : (EthereumNode.web3 = Web3Helper.connectWeb3(Web3ProviderType.InfuraWs));
    EthereumNode.block_height = await EthereumNode.web3?.eth.getBlockNumber();
    logger.debug(`block height:${EthereumNode.block_height} as of ${new Date()}`);
    EthereumNode.node_info = await EthereumNode.web3?.eth.getNodeInfo();
    logger.debug(`node info: ${JSON.stringify(EthereumNode.node_info)}`);
    if (VERBOSE) {
      const verifyGenesis = (await EthereumNode.web3?.eth.getBlock(0))?.hash.toString();
      EthereumNode.genesis_block === verifyGenesis
        ? logger.info(`verified blockchain using the genesis block:${EthereumNode.genesis_block}`)
        : logger.info(`blockchain did not return the espected genesis block instead ${verifyGenesis}`);
    }
    return EthereumNode.web3;
  };

  public static getPendingTransactions = async () => {
    try {
      EthereumNode.pending_mempool = {
        block_height: await EthereumNode.web3?.eth.getBlockNumber(),
        transactions: await EthereumNode.web3?.eth.getPendingTransactions(),
      };
      return EthereumNode.pending_mempool;
    } catch (e) {
      logger.error(
        `Node connection:${JSON.stringify(await EthereumNode.web3?.currentProvider)} (${EthereumNode.node_info})`,
      );
      logger.error(JSON.stringify(e));
    }
    return undefined;
  };

  public static disconnectWeb3 = (): void => {
    EthereumNode.web3
      ? Web3Helper.disconnectWeb3()
      : (Web3Helper.getHandle().currentProvider as WebsocketProvider)?.disconnect(
          1000,
          'Finished using the socket, bye.',
        );
    EthereumNode.web3 = undefined;
  };
}
