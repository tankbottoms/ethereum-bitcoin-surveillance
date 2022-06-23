/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-void */
import { RPCClient } from 'rpc-bitcoin';
import { Mongo } from '../mongodb';
import {
  BTC_NODE_IP,
  BTC_NODE_USER,
  BTC_NODE_PASSWORD,
  BTC_NODE_PORT,
  BTC_RPC_TIMEOUT,
  DB_MEMPOOL_COLLECTION,
  BTC_MEMPOOL_INTERVAL,
} from '../config';
import { DATABASE_NAME_BTC } from '../config/mongo';
import { logger } from '../utils/logger';

export type BitcoinNodeConfig = {
  url: string;
  port: number;
  user: string;
  password: string;
  timeout: number;
};

const btc_http_rpc: BitcoinNodeConfig = {
  url: `http://${BTC_NODE_IP}`,
  port: parseInt(`${BTC_NODE_PORT}`),
  user: BTC_NODE_USER,
  password: BTC_NODE_PASSWORD,
  timeout: BTC_RPC_TIMEOUT,
};

const { url, port, user, password, timeout } = btc_http_rpc;
const btc_node = new RPCClient({ url, port, timeout, user, pass: password });

logger.info(`${BTC_NODE_IP}, ${BTC_NODE_USER}, ${BTC_NODE_PASSWORD}`);
logger.info(`${JSON.stringify(btc_http_rpc)}`);

let mempool_cache = {};

let mempool_transaction_count = 0;
let block_height = 0;
let previous_mempool_length = 0;

const filter_mempool = async (mempool: any) => {
  console.log(`mempool filtering step`);
  const hash = await btc_node.getblockhash({ height: block_height + 1 });
  const block = await btc_node.getblock({ blockhash: hash, verbosity: 2 });
};

const test_mempool = async () => {
  const raw_mempool = await btc_node.getrawmempool({ verbose: true });
  const current_block_height = await btc_node.getblockcount();

  if (block_height !== 0 && current_block_height > block_height) {
    logger.info(
      `cached mempool pending block number ${block_height} needs to be analyzed because new block was detected, ` +
        `block height: ${current_block_height}`,
    );
    await filter_mempool(raw_mempool);
    return;
  } else {
    block_height = current_block_height;
    mempool_cache = raw_mempool;

    const mempool_payload = Object.entries(raw_mempool);
    const mempool_count: number = mempool_payload.length;

    mempool_transaction_count === 0 ? (mempool_transaction_count = mempool_count) : null;

    if (mempool_transaction_count < mempool_count) {
      let i: number = 0;
      for (const [txid, value] of mempool_payload) {
        const payload: any = value;
        const { height, wtxid, fees, weight, time } = payload;
        i === 0
          ? logger.info(
              `(tx no.:${mempool_count}, Д:${mempool_transaction_count}),` +
                ` block no.${payload.height}` +
                ` ts:${time}, (${i}) wtxid:${wtxid}, ` +
                `base fee:${fees.base}, weight:${weight} ` +
                `\n`,
            )
          : null;
        i++;
      }
      return;
    } else {
      mempool_transaction_count = mempool_count;
    }
  }
};

export const upload_mempool = async (): Promise<any[]> => {
  const mempool_array: any[] = [];
  try {
    let raw_mempool,
      i = 0;
    try {
      raw_mempool = await btc_node.getrawmempool({ verbose: true });
    } catch (error) {}
    if (!raw_mempool) return mempool_array;
    const mempool_payload = Object.entries(raw_mempool);
    if (previous_mempool_length !== 0 && previous_mempool_length !== mempool_payload.length) {
      logger.info(`initial mempool count:${previous_mempool_length} new mempool count:${mempool_payload.length}`);
      previous_mempool_length = mempool_payload.length;
      for (const [txid, values] of mempool_payload) {
        const payload: any = values;
        true &&
          i === 0 &&
          logger.info(
            `(${i + 1}/${mempool_payload.length}), ` +
              `height:${payload.height}, ts:${payload.time}, txid:${txid} wtxid:${payload.wtxid}, ` +
              `base fee:${payload.fees.base}, weight:${payload.weight}`,
          );
        i++;
        const mempool = { ...payload, txid };
        mempool_array.push(mempool);
      }
    } else {
      previous_mempool_length = mempool_payload.length;
    }
    return mempool_array;
  } catch (error) {
    console.log(error);
    return mempool_array;
  }
};

const remove_blocked_transactions = async (mempool_array_cache: any[]) => {
  try {
    let filtered_mempool: any[] = [];
    const current_block_height = await btc_node.getblockcount();
    if (block_height === 0 || current_block_height > block_height) {
      logger.info(`previous block height:${block_height} current_block_height:${current_block_height}`);
      block_height = current_block_height;
      const blockhash = await btc_node.getblockhash({ height: block_height });
      const block = await btc_node.getblock({ blockhash, verbosity: 2 });
      logger.info(`new block transactions count: ${block.tx.length}`);
      const tx_array = block.tx.map((a: { txid: any }) => a.txid);
      mempool_array_cache.length > 0 &&
        console.log(`filtering initial mempool of ${mempool_array_cache?.length} trx for confirmed trnx`);
      for (const txid of tx_array) {
        try {
          if (mempool_array_cache.length > 0)
            filtered_mempool = mempool_array_cache.filter(mempool => mempool.txid !== txid);
          continue;
        } catch (error) {
          console.log(error);
          continue;
        }
      }
      mempool_array_cache &&
        console.log(
          `mempool before block: ${mempool_array_cache.length},mempool after block: ${
            filtered_mempool?.length
          } difference ${mempool_array_cache.length - filtered_mempool.length}`,
        );
      false && mempool_array_cache && (await Mongo.insert_many(DB_MEMPOOL_COLLECTION, filtered_mempool));
    } else {
      block_height = current_block_height;
    }
    return;
  } catch (error) {}
};

(async () => {
  const CONTINUE_MEMPOOL: boolean = true;
  await Mongo.connect();
  await Mongo.create_database(DATABASE_NAME_BTC);

  setInterval(async () => {
    false && (await test_mempool());
    const array_mempool = await upload_mempool();
    true && (await remove_blocked_transactions(array_mempool));
  }, Number(500 || BTC_MEMPOOL_INTERVAL));

  CONTINUE_MEMPOOL ? await Mongo.disconnect() : null;
})();
