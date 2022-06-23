import { Collection, MongoClient } from 'mongodb';
import { BLOCKS_COLLECTION, DATABASE_NAME_ETH, MONGODB, TRANSACTIONS_COLLECTION } from '../config/mongo';
import { logger } from '../utils';

const VERBOSE = true;

export const client = new MongoClient(MONGODB);

type EthereumBlockIndex = { number: number; id: number; timestamp: number };
export type EthereumTransactionIndex = {
  _id: number;
  transactionIndex: number;
  blockNumber: number;
  compound: number;
  hash: number;
  value: number;
};

export const create_block_index = async () => {
  await client.connect();
  logger.debug(`connected successfully to ${MONGODB}`);
  const db = client.db(DATABASE_NAME_ETH);
  logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
  const collection: Collection<Document> = db.collection(BLOCKS_COLLECTION);

  const index_values: EthereumBlockIndex = { number: 1, id: 1, timestamp: 1 };
  const index = await collection.createIndex(index_values);

  logger.debug(`created block index:${JSON.stringify(index)}`);
  await client.close();
  return index;
};

export const create_transaction_index = async () => {
  await client.connect();
  logger.debug(`connected successfully to ${MONGODB}`);
  const db = client.db(DATABASE_NAME_ETH);
  logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
  const collection: Collection<Document> = db.collection(TRANSACTIONS_COLLECTION);
  const index_values: EthereumTransactionIndex = {
    _id: 1,
    blockNumber: 1,
    compound: 1,
    hash: 1,
    transactionIndex: 1,
    value: 1,
  };

  const index = await collection.createIndex(index_values);
  logger.debug(`created transaction index:${JSON.stringify(index)}`);
  await client.close();
  return index;
};

async () => {
  logger.info(`connecting to ${MONGODB}`);
  logger.info(`${BLOCKS_COLLECTION}`);
  logger.info(`${TRANSACTIONS_COLLECTION}`);
  await create_block_index();
  await create_transaction_index();
};
