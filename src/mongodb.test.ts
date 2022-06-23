/* eslint-disable @typescript-eslint/no-floating-promises */
import { Mongo } from './mongodb';
import { logger } from './utils';
import { DB_MEMPOOL_COLLECTION, VERBOSE } from './config';
import {
  MONGODB,
  DATABASE_NAME_ETH,
  DATABASE_NAME_BTC,
  BLOCKS_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from './config/mongo';

export const verify_btc_mongo = async () => {
  await Mongo.connect(MONGODB);
  await Mongo.create_database(DATABASE_NAME_BTC);
  const blockDocuments = await Mongo.find_all(BLOCKS_COLLECTION);
  const transactionsDocuments = await Mongo.find_all(TRANSACTIONS_COLLECTION);
  console.log(blockDocuments ? blockDocuments[0] : null, ` ${DATABASE_NAME_ETH} ${BLOCKS_COLLECTION} documents`);
  console.log(
    transactionsDocuments ? transactionsDocuments[0] : null,
    ` ${DATABASE_NAME_ETH} ${TRANSACTIONS_COLLECTION} documents`,
  );
  await Mongo.delete_database(DATABASE_NAME_BTC);
  await Mongo.disconnect();
};

export const verify_eth_mongo = async () => {
  await Mongo.connect(MONGODB);
  await Mongo.create_database(DATABASE_NAME_ETH);
  const blockDocuments = await Mongo.find_all(BLOCKS_COLLECTION);
  const transactionsDocuments = await Mongo.find_all(TRANSACTIONS_COLLECTION);
  console.log(blockDocuments ? blockDocuments[0] : null, ` ${DATABASE_NAME_ETH} ${BLOCKS_COLLECTION} documents`);
  console.log(
    transactionsDocuments ? transactionsDocuments[0] : null,
    ` ${DATABASE_NAME_ETH} ${TRANSACTIONS_COLLECTION} documents`,
  );
  await Mongo.delete_database(DATABASE_NAME_ETH);
  await Mongo.disconnect();
};

export const clear_eth_collections = async () => {
  await Mongo.get_instance();
  await Mongo.connect(MONGODB);
  await Mongo.create_database(DATABASE_NAME_ETH);
  await Mongo.delete_collection(BLOCKS_COLLECTION);
  await Mongo.delete_collection(TRANSACTIONS_COLLECTION);
  await Mongo.disconnect();
};

export const clear_btc_mempool_collections = async () => {
  await Mongo.get_instance();
  await Mongo.connect(MONGODB);
  await Mongo.create_database(DATABASE_NAME_BTC);
  await Mongo.delete_collection(DB_MEMPOOL_COLLECTION);
  await Mongo.disconnect();
};

(async () => {
  logger.info(`verbosity:${VERBOSE}`);
  false && (await verify_btc_mongo());
  true && (await verify_eth_mongo());
  false && (await clear_eth_collections());
  false && (await clear_btc_mempool_collections());
})();
