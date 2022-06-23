import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { BLANK } from '../utils/constants';

dotenv.config();

const random = (max: number) => {
  return Math.floor(Math.random() * max);
};

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
!fs.existsSync(`.env`) ? console.warn(`ENV:.env not found, enabling VERBOSE, (see env.template)`) : null;

export const VERBOSE: boolean = !fs.existsSync(`.env`) ? true : process.env?.VERBOSE === 'true' ? true : false;
export const NODE_ENV: string = process.env?.NODE_ENV ?? 'development';

export const PUSHOVER_USER: string = process.env?.PUSHOVER_USER || BLANK;
export const PUSHOVER_TOKEN: string = process.env?.PUSHOVER_TOKEN || BLANK;

export const INFURA_API_KEYS: string[] = [];
export const ETHERSCAN_API_KEYS: string[] = [];

const key_count = 11;

for (let i = 0; i < key_count; i++) {
  const env_key = process.env[String(`INFURA_API_KEY_` + zeroPad(i, 3))] || BLANK;
  env_key.length ? INFURA_API_KEYS.push(env_key) : null;
}

for (let i = 0; i < key_count; i++) {
  const env_key = process.env[String(`ETHERSCAN_API_KEY_` + zeroPad(i, 3))] || BLANK;
  env_key.length ? ETHERSCAN_API_KEYS.push(env_key) : null;
}

export const INFURA_API_KEY: string =
  INFURA_API_KEYS.length >= 1 ? INFURA_API_KEYS[random(INFURA_API_KEYS.length)] : '6b4cbecb2c8f4d369b78ebd576c58270';

export const ETHERSCAN_API_KEY: string =
  ETHERSCAN_API_KEYS.length >= 1
    ? ETHERSCAN_API_KEYS[random(ETHERSCAN_API_KEYS.length)]
    : 'YM88X39NFYCHJG583153DY37VSR3I4CFA5';

export const INFURA_HTTPS: string = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
export const INFURA_WS: string = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;

INFURA_API_KEYS.length
  ? VERBOSE &&
    INFURA_API_KEYS.forEach(k => {
      console.info(`INFURA_API_KEY: ${k}`);
    })
  : VERBOSE && console.warn(`INFURA_API_KEYS:undefined`);

INFURA_HTTPS
  ? VERBOSE && console.info(`INFURA_HTTPS:${INFURA_HTTPS}`)
  : VERBOSE && console.warn(`INFURA_HTTPS:undefined`);
INFURA_WS ? VERBOSE && console.info(`INFURA_WS:${INFURA_WS}`) : VERBOSE && console.warn(`INFURA_WS:undefined`);

ETHERSCAN_API_KEYS.length
  ? VERBOSE &&
    ETHERSCAN_API_KEYS.forEach(k => {
      console.info(`ETHERSCAN_API_KEY: ${k}`);
    })
  : VERBOSE && console.warn(`ETHERSCAN_API_KEYS:undefined`);

ETHERSCAN_API_KEY
  ? VERBOSE && console.info(`ETHERSCAN API KEY:${ETHERSCAN_API_KEY}`)
  : VERBOSE && console.warn(`ETHERSCAN_API_KEY:undefined`);

/**
 * A random, non-empty string used as a default document id in MongoDb
 * that is designed to not produce any matches when you do
 * mongo.collection('PATH').doc(DEFAULT_ID)
 */
export const DEFAULT_ID =
  'cb5d0a377e753a3159bf034cdbc84c47676b11a51349f0606e32e4504d4b678ecbda0b069a468c05867871627562fd63678f5f6ed550e59743e0e10bce747ae7';

export * from './addresses';
export { BLANK } from '../utils/constants';

!fs.existsSync('.env') ? console.warn('ENV:.env not found, enabling VERBOSE, (see env.template)') : null;

// BTC AWS NODE Config cascades to root BTC NODE
export const BTC_NODE_AWS_IP: string = process.env?.BTC_NODE_AWS_IP || '67.171.23.171';
export const BTC_NODE_AWS_PORT: number = Number(process.env?.BTC_NODE_AWS_PORT) || 8332;
export const BTC_NODE_AWS_USER: string = process.env?.BTC_NODE_AWS_USER || 'rpcuser';
export const BTC_NODE_AWS_PASS: string = process.env?.BTC_NODE_AWS_PASS || 'rpcpassword';

export const BTC_NODE_IP = process.env?.BTC_HOST_IP || BTC_NODE_AWS_IP;
export const BTC_NODE_PORT = process.env?.BTC_NODE_PORT || BTC_NODE_AWS_PORT;
export const BTC_RPC_TIMEOUT: number = Number(process.env?.BTC_RPC_TIMEOUT) || 10000;
export const BTC_NODE_USER = process.env?.BTC_RPC_USER || BTC_NODE_AWS_USER;
export const BTC_NODE_PASSWORD = process.env?.BTC_RPC_PASSWORD || BTC_NODE_AWS_PASS;
export const BTC_USER = BTC_NODE_USER.replace(/[",;]/g, '');
export const BTC_PASS = BTC_NODE_PASSWORD.replace(/[",;]/g, '');

export const BTC_NETWORK_NAME = process.env?.BTC_NETWORK_NAME || 'mainnet';
export const BTC_URI: string = process.env?.BTC_URI || `http://${BTC_USER}:${BTC_PASS}@${BTC_NODE_IP}:${BTC_NODE_PORT}`;

BTC_NODE_IP && BTC_NODE_PORT && BTC_USER && BTC_PASS
  ? VERBOSE && console.log(`BTC NODE SETTINGS:${BTC_URI}`)
  : VERBOSE && console.warn('BTC NODE SETTINGS:undefined');

export const ETH_NODE_AWS_IP: string = process.env?.ETH_NODE_AWS_IP || '127.0.0.1';
export const ETH_NODE_AWS_HTTP_PORT: number = Number(process.env?.ETH_NODE_AWS_HTTP_PORT) || 8545;
export const ETH_NODE_AWS_WS_PORT: number = Number(process.env?.ETH_NODE_AWS_WS_PORT) || 8546;

export const ETH_NODE_IP: string = process.env?.ETH_NODE_IP || ETH_NODE_AWS_IP;
export const ETH_NODE_PORT: number = Number(process.env?.ETH_NODE_PORT) || ETH_NODE_AWS_HTTP_PORT;
export const ETH_NODE_AUTH_HEADER: string = process.env?.ETH_NODE_AUTH_HEADER || BLANK;
export const ETH_NODE_TYPE: string = process.env?.ETH_NODE_TYPE || 'Geth';
export const ETH_NODE_MAX_RECEIVED_FRAME_SIZE: number =
  Number(process.env?.ETH_NODE_MAX_RECEIVED_FRAME_SIZE) || 100000000;
export const ETH_URI: string = process.env?.ETH_URI || `http://${ETH_NODE_IP}:${ETH_NODE_PORT}`;

ETH_NODE_IP && ETH_NODE_PORT
  ? VERBOSE && console.log(`ETH NODE SETTINGS:${ETH_URI}`)
  : VERBOSE && console.warn('ETH NODE SETTINGS:undefined');

export const MONGO_HOST_AWS_IP = process.env?.MONGO_HOST_AWS_IP || BLANK;
export const MONGO_HOST_AWS_PORT = process.env?.MONGO_HOST_AWS_PORT || BLANK;
export const MONGO_HOST_AWS_USER = process.env?.MONGO_HOST_AWS_USER || BLANK;
export const MONGO_HOST_AWS_PASS = process.env?.MONGO_HOST_AWS_PASS || BLANK;

export const MONGO_HOST_IP = process.env?.MONGO_HOST_IP || '127.0.0.1';
export const MONGO_HOST_PORT = process.env?.MONGO_HOST_PORT || 27017;
export const MONGO_CONCURRENCY = process.env?.MONGO_CONCURRENCY || 25;
export const MONGO_URI: string = process.env?.MONGO_URI || `mongodb://${MONGO_HOST_IP}:${MONGO_HOST_PORT}`;

MONGO_HOST_IP && MONGO_HOST_PORT
  ? VERBOSE && console.log(`MONGO DB URI:${MONGO_URI}`)
  : VERBOSE && console.warn('MONGO DB URI:undefined');

export const MONGO_HOST_REMOTE = process.env?.MONGO_HOST_REMOTE || '';
export const MONGO_HOST_REMOTE_ETH_DB = process.env?.MONGO_HOST_REMOTE_ETH_DB || '';
export const MONGO_HOST_REMOTE_BTC_DB = process.env?.MONGO_HOST_REMOTE_BTC_DB || '';
export const MONGO_HOST_REMOTE_BLOCK_COLLECTION = process.env?.MONGO_HOST_REMOTE_BLOCK_COLLECTION || '';
export const MONGO_HOST_REMOTE_TRANSACTION_COLLECTION = process.env?.MONGO_HOST_REMOTE_TRANSACTION_COLLECTION || '';
export const MONGO_HOST_REMOTE_CONFIGURATION_COLLECTION = process.env?.MONGO_HOST_REMOTE_CONFIGURATION_COLLECTION || '';

export const MONGODB_CONNECTION_STRING = process.env?.MONGODB_CONNECTION_STRING || '';
export const MONGO_INFOSEC = process.env?.MONGO_INFOSEC || false;

export const DB_NAME_BTC: string = process.env?.DB_NAME_BTC || '';
export const DB_NAME_ETH: string = process.env?.DB_NAME_ETH || '';
export const DB_BLOCKS_COLLECTION: string = process.env?.BTC_DB_BLOCKS_COLLECTION || 'blocks';
export const DB_TRANSACTIONS_COLLECTION: string = process.env?.DB_TRANSACTIONS_COLLECTION || 'transactions';
export const DB_MEMPOOL_COLLECTION: string = process.env?.DB_MEMPOOL_COLLECTION || 'mempool';
export const DB_CONTRACT_COLLECTION: string = process.env?.DB_CONTRACT_COLLECTION || 'contracts';
export const DB_CONTRACTS_COLLECTION: string = process.env?.DB_CONTRACTS_COLLECTION || 'contract_transactions';
export const DB_ERRORS_COLLECTION: string = process.env?.DB_ERRORS_COLLECTION || 'errors';
export const DB_CONFIGURATION_COLLECTION: string = process.env?.DB_CONFIGURATION_COLLECTION || 'configurations';

export const CURRENT_JOB_STATE_CACHE_FILENAME: string =
  process.env?.CURRENT_JOB_STATE_CACHE_FILENAME || '.current_job.json';
export const JOB_HISTORY_CACHE_FILENAME: string = process.env?.JOB_HISTORY_CACHE_FILENAME || '.job_history.json';

export const BLOCKS = 0x1;
export const TRANSACTIONS = 0x2;
export const MEMPOOL = 0x3;
export const CONTRACTS = 0x4;
export const ADDRESSES = 0x5;

NODE_ENV ? VERBOSE && console.log(`NODE_ENV:${NODE_ENV}`) : VERBOSE && console.warn('NODE_ENV:undefined');

export const AMBERDATA_IO_API_KEY: string = process.env?.AMBERDATA_IO_API_KEY || 'UAKe4b74deca86a46e8891fe27e133bb1ae';
export const MESSARI_AGGREGATE_URL: string =
  process.env?.MESSARI_AGGREGATE_URL || `https://data.messari.io/api/v1/assets\?limit=1000`;
export const MESSARI_COIN_METRIC_URL: string =
  process.env?.MESSARI_COIN_METRIC_URL || 'https://data.messari.io/api/v1/assets/';
export const MESSARI_COIN_NEWS_URL: string =
  process.env?.MESSARI_COIN_NEWS_URL || 'https://data.messari.io/api/v1/news/';
export const AGGREGATE_MARKETCAP_LIMIT: number = Number(process.env?.AGGREGATE_MARKETCAP_LIMIT) || 20000000;
export const EXCLUDE_TRANSACTIONS = process.env?.EXCLUDE_TRANSACTIONS || false;

export const BTC_MEMPOOL_INTERVAL = process.env?.BTC_MEMPOOL_INTERVAL || '200';
export const ETC_MEMPOOL_INTERVAL = process.env?.BTC_MEMPOOL_INTERVAL || '200';

export const RESHAPE = process.env.RESHAPE === 'true';
