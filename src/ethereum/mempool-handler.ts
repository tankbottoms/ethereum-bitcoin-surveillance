import Web3 from 'web3';
import { DB_MEMPOOL_COLLECTION, DB_NAME_ETH, ETH_URI } from '../config';
import { Mongo } from '../mongodb';
import { logger } from '../utils';

export const mempool_handler = async (args?: any) => {
  logger.info(`${args}`);
  false && (await Mongo.update_documents(DB_MEMPOOL_COLLECTION, { hash: args.hash }, args));
};

export const ethereum_mempool_handler = async (options: { extraction_type: string; verbosity: boolean }) => {
  const ethereum: Web3 = new Web3(new Web3.providers.HttpProvider(ETH_URI));
  const block_height = await ethereum.eth.getBlockNumber();
  const block = await ethereum.eth.getBlock(block_height, false);
  await mempool_handler(block);

  false && options.extraction_type === 'mempool' ? await Mongo.connect() : null;
  false && options.extraction_type === 'mempool' ? await Mongo.create_database(DB_NAME_ETH) : null;
  false && options.extraction_type === 'mempool' ? await Mongo.disconnect() : null;
};
