import { MongoClient, Collection } from 'mongodb';
import { DB_NAME_ETH, VERBOSE } from '../config';
import { BLOCKS_COLLECTION, DATABASE_NAME_ETH, MONGODB } from '../config/mongo';
import { Mongo } from '../mongodb';
import { BlockRangeConfiguration, EthereumProcessingOptions } from '../types';
import { logger } from '../utils';
import { EthereumNode } from './node';

export const cached_options = {
  extraction_type: 'blocks_transactions',
  type: 'blocks_transactions',
  start_block: 0,
  start: 0,
  end_block: -1,
  end: -1,
  size_block: -1,
  size: -1,
  from_date: '08/10/2021',
  f: '',
  to_date: '08/11/2021',
  t: '',
  target: 'database',
  db: 'database',
  block_range_concurrency: 10,
  block_range: [],
  block_concurrency: 15,
  block: 15,
  transaction_concurrency: 10,
  transaction: 10,
  concurrency: 10,
  c: 10,
  min_time: 1000,
  min: 1000,
  verbosity: true,
  v: true,
  job_id: '',
};

export const get_options = (): EthereumProcessingOptions => {
  const options: EthereumProcessingOptions = cached_options;
  return options;
};

export const ethereum_test_handler = async () => {
  const test_options = get_options();
  const {
    block_range,
    start_block,
    end_block,
    block_range_concurrency,
    block_concurrency,
    transaction_concurrency,
    get_transactions,
  } = test_options;

  const block_configuration: BlockRangeConfiguration = {
    block_range: block_range,
    start_block: start_block,
    end_block: end_block,
    block_range_concurrency: block_range_concurrency,
    block_concurrency: block_concurrency,
    transaction_concurrency: transaction_concurrency,
    get_transactions: get_transactions,
  };

  logger.info(`ethereum_handler received configuration object => ${JSON.stringify(test_options)}`);

  // const ethereum: EthereumNode = new EthereumNode(true);

  // await ethereum.initialize(test_options);
  await Mongo.connect();
  await Mongo.create_database(DB_NAME_ETH);
  // await ethereum.set_block_range_concurrency(block_configuration);
  // await ethereum.get_block_transactions(block_configuration);
  await Mongo.disconnect();
};

(async () => {
  false && (await ethereum_test_handler());
})();
