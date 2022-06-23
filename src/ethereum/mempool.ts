/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-void */
import Web3 from 'web3';
import { Mongo } from '../mongodb';
import { DATABASE_NAME_ETH } from '../config/mongo';
import { DB_MEMPOOL_COLLECTION, ETC_MEMPOOL_INTERVAL, ETH_NODE_AWS_IP, ETH_NODE_AWS_WS_PORT, ETH_URI } from '../config';
import { deepCopy, logger } from '../utils';

const aws_eth_archive = `http://67.171.23.171:8545/`;

const web3: Web3 = new Web3(new Web3.providers.HttpProvider(aws_eth_archive));
/*
const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_WS_PORT}`, options));
*/

const options = {
  timeout: 300000,
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  },
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 15,
    onTimeout: false,
  },
};

let cached_mempool = {};
let block_height = 0;
let previous_mempool_length = 0;

export const collect_mempool = async (): Promise<any[]> => {
  //add txpool support
  web3.extend({
    property: 'txpool',
    methods: [
      {
        name: 'content',
        call: 'txpool_content',
      },
      {
        name: 'status',
        call: 'txpool_status',
      },
      {
        name: 'inspect',
        call: 'txpool_inspect',
      },
    ],
  });
  // @ts-ignore
  await web3.txpool.content((err, data) => {
    console.log(err, data);
  });
  // @ts-ignore
  await web3.txpool.status((err, data) => {
    console.log(err, data);
  });
  // @ts-ignore
  await web3.txpool.inspect((err, data) => {
    console.log(err, data);
  });
  const mempool_array: any[] = [];
  try {
    let raw_mempool,
      i = 0;
    try {
      raw_mempool = await web3.eth.getPendingTransactions();
    } catch (error) {}
    console.log(raw_mempool, 'raw mempool');

    // if (!raw_mempool) return mempool_array;
    const mempool_payload = raw_mempool || [];
    if (previous_mempool_length !== 0 && previous_mempool_length !== mempool_payload.length) {
      logger.info(`mempool tx count:${previous_mempool_length} => ` + `mempool tx count:${mempool_payload.length}`);
      previous_mempool_length = mempool_payload.length;
      for (const payload of mempool_payload) {
        true &&
          i === mempool_payload.length &&
          logger.info(
            `(${i + 1}/${mempool_payload.length}), ` +
              `height:${payload.blockNumber}, txid:${payload.transactionIndex} hash:${payload.hash}, ` +
              `gas:${payload.gas}, value:${payload.value} blockHash:${payload.blockHash}` +
              `\n`,
          );
        i++;
      }
    } else {
      previous_mempool_length = mempool_payload.length;
    }
    cached_mempool = deepCopy(mempool_payload);
    return mempool_payload;
  } catch (error) {
    logger.error(error);
    return mempool_array;
  }
};

const remove_blocked_transactions = async () => {
  const mempool_array_cache: any[] = Object.values(cached_mempool);
  try {
    if (mempool_array_cache.length <= 0) return;
    let filtered_mempool: any[] = [];
    const current_block_height = await web3.eth.getBlockNumber();
    if (block_height === 0 || current_block_height > block_height) {
      const filter = { blockHeight: block_height };
      logger.info(`previous block height:${block_height} => current_block_height:${current_block_height}`);
      block_height = current_block_height;
      const block = await web3?.eth.getBlock(block_height, true);
      logger.info(
        `mempool cache count: ${mempool_array_cache.length} => new block transactions count:${block.transactions.length}` +
          `\n`,
      );
      const tx_array = block.transactions;
      logger.info(
        `filtering initial mempool of ${mempool_array_cache?.length} transactions for confirmed transactions`,
      );
      filtered_mempool = mempool_array_cache.filter(mempool => !tx_array.includes(mempool.txid));
      mempool_array_cache &&
        logger.info(
          `mempool before block:${mempool_array_cache.length}, ` +
            `mempool after block:${filtered_mempool?.length}, ` +
            `difference ${mempool_array_cache.length - filtered_mempool.length}`,
        );
      filtered_mempool.length > 0 &&
        mempool_array_cache.length > 0 &&
        (await Mongo.update_documents(DB_MEMPOOL_COLLECTION, filter, { mempool: deepCopy(filtered_mempool) }));
    } else {
      block_height = current_block_height;
    }
    return;
  } catch (error) {
    logger.error(error);
  }
};

const check_eth_sync = async () => {
  try {
    const latest = await web3.eth.getBlock('latest');
    const sync = await web3.eth.isSyncing();
    const SAMPLE_CONTRACT_ADDRESS = '0xCE354148B47b29907EE984F553Cb7c9606c32A29';
    console.log(sync, latest.number);

    web3.eth
      .subscribe(
        'logs',
        {
          address: SAMPLE_CONTRACT_ADDRESS,
        },
        function (error, result) {
          if (!error) console.log(result);
        },
      )
      .on('connected', function (subscriptionId) {
        console.log('subscriptionId:' + subscriptionId);
      })
      .on('data', function (log) {
        console.log('data:' + log);
      })
      .on('changed', function (log) {
        console.log('changed:' + log);
      });
  } catch (error) {
    console.log(error);
  }
};

const get_pendinging_trnx = () => {
  const subscription = web3.eth.subscribe('pendingTransactions', (err, res) => {
    if (err) console.error(err);
  });

  const init = function () {
    subscription.on('data', txHash => {
      setTimeout(async () => {
        try {
          const tx = await web3.eth.getTransaction(txHash);
          console.log(tx);
        } catch (err) {
          console.error(err);
        }
      });
    });
  };

  init();
};

(async () => {
  await Mongo.connect();
  await Mongo.create_database(DATABASE_NAME_ETH);
  setInterval(async () => {
    true && check_eth_sync();
    false && (await collect_mempool());
    false && (await remove_blocked_transactions());
  }, Number(500 || ETC_MEMPOOL_INTERVAL));
})();
