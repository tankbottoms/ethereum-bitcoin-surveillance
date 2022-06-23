import { Mongo } from '../mongodb';
import { PQueue } from '../p-queue';
import { EthereumProcessingOptions } from '../types';
import { MONGODB, BLOCKS_COLLECTION, TRANSACTIONS_COLLECTION, DATABASE_NAME_ETH } from '../config/mongo';
import { create_block_index, create_transaction_index } from './db-index';
import { logger } from '../utils';
import { add_error_block, completed_status, update_current_block } from '../cache/job-state';
import { MONGO_CONCURRENCY } from '../config';
import { ethereum_speedrun_get_block_range_with_options } from './process';
import { check_ethereum_block_range } from './db-helper';
import BlockchainETL from '../core';
import { complexConfig, initConfig } from '../core/simple-config';

const mongo_concurrency = parseInt(`${MONGO_CONCURRENCY}`) || 25;
const mongo_queue = new PQueue({ concurrency: mongo_concurrency });

export const set_job_state_handler = async (args: any) => {
  const { status } = args;
  switch (status) {
    case 'update_start_block':
      const { current_block } = args;
      await update_current_block(current_block);
      break;
    case 'error':
      const { block_number } = args;
      await add_error_block(block_number);
      break;
    case 'completed':
      await completed_status();
      break;
    default:
      await completed_status();
  }
};

// export const completed_job_state_handler = async (args: any) => {};

export const block_handler = async (args: any) => {
  await mongo_queue.add(async () => {
    logger.debug(`updating block number => ${JSON.stringify(args.number)}`);
    await Mongo.update_documents(BLOCKS_COLLECTION, { number: args.number }, args);
  });
};

export const block_range_handler = async (args: any) => {
  await mongo_queue.add(async () => {
    await check_ethereum_block_range(args);
  });
};

export const transactions_handler = async (args: any, blockNumber: string) => {
  await mongo_queue.add(async () => {
    logger.debug(`transactions_handler insert_many => ${JSON.stringify(args.length)}`);
    let blockExists = false;
    const query = { blockNumber };
    blockExists = await Mongo.isExists(TRANSACTIONS_COLLECTION, query);
    if (blockExists) return;
    await Mongo.insert_many(TRANSACTIONS_COLLECTION, args);
  });
};

export const transaction_handler = async (args: any) => {
  await mongo_queue.add(async () => {
    logger.debug(`updating transaction block number => ${JSON.stringify(args.blockNumber)}`);
    await Mongo.update_documents(TRANSACTIONS_COLLECTION, { blockNumber: args.blockNumber }, args);
  });
};

export const ethereum_handler = async (options: EthereumProcessingOptions) => {
  // called from yargs
  //logger.warn(`ethereum_handler received configuration object => ${JSON.stringify(options)}`);

  // call into eth logger
  initConfig(options);
  const el = new BlockchainETL();
  await el.run();

  // await Mongo.connect();
  // await Mongo.create_database(DATABASE_NAME_ETH);
  // logger.info(`mongo database ${MONGODB}, collection:${BLOCKS_COLLECTION}, ${TRANSACTIONS_COLLECTION} loaded`);
  // await create_block_index();
  // await create_transaction_index();
  // await ethereum_speedrun_get_block_range_with_options(options);
};
