import Web3 from 'web3';
import { ETH_URI } from '../config';
import { PQueue } from '../p-queue';
import { logger, zeroPad, updateTimestamp } from '../utils';
import { assert } from 'console';

const aws_eth_archive = `http://3.210.181.231:8545/`;
const aws_eth_node = `http://52.21.97.126:8545/';
`;
const active: Web3 = new Web3(new Web3.providers.HttpProvider(aws_eth_archive));
const shape_normal = `[
  "difficulty","extraData","gasLimit","gasUsed","hash","logsBloom","miner","mixHash",
  "nonce","number","parentHash","receiptsRoot","sha3Uncles","size","stateRoot",
  "timestamp","totalDifficulty","transactions","transactionsRoot","uncles"] `;
export const getTime = () => {
  return Date.now();
};

export const getElapsed = (now: number) => {
  return Date.now() - now;
};

export const getRange = (start: number, size: number): number[] => {
  return [...Array(size).keys()].map(i => start + i);
};

export const processBlockTransactions = async (block_range: number[], max_concurrent?: number): Promise<any> => {
  const index_length = String(eth_block_height).length;
  const tx_concurrent = max_concurrent ? max_concurrent : block_range.length / 4;
  const transaction_queue = new PQueue({ concurrency: tx_concurrent });

  transaction_queue.on('active', () => {
    false &&
      logger.info(
        `${block_range[0]}-${block_range[block_range.length - 1]}, ` +
          `size:${transaction_queue.size}, pending:${transaction_queue.pending}`,
      );
  });

  block_range.forEach(async block_index => {
    try {
      await transaction_queue.add(async () => {
        const block_timer = getTime();
        const block = await active?.eth.getBlock(block_index, true);
        active_block_get = block_index; // SIGNINT
        // @ts-ignore
        const { transactions, hash, gasLimit, gasUsed, logsBloom, size, parentHash } = block;
        const contracts = transactions.filter((tx: any) => tx.from && tx.to === null);
        logger.debug(
          `(${zeroPad(block_index, index_length)}) hash:${hash}, ts:${updateTimestamp(block.timestamp)},` +
            ` tx:${transactions.length}, sol:${contracts.length}, ` +
            `gas:${gasUsed}, (${getElapsed(block_timer)} ms)`,
        );
        logger.debug(`(${zeroPad(block_index, index_length)}) ${JSON.stringify(Object.keys(block))}`);

        const shape = JSON.stringify(Object.keys(block));
        shape !== shape_normal
          ? logger.info(`${block_index} normal, ${shape}`)
          : logger.info(`${block_index} ${shape}`);

        transactions.forEach(transaction => {
          // @ts-ignore
          const { blockNumber, transactionIndex, input, from, to, value, gas, gasPrice } = transaction;
          transactionIndex ? (active_tx_get = transactionIndex) : null; // SIGNINT
          assert(blockNumber === block_index);
          false && to === null ? logger.info(`\t` + `(${transactionIndex}) ${from} => size:${input.length}`) : null;
        });
      });
    } catch (e) {
      logger.error(`\t` + `(${block_index}) ${e}` + `\n`);
    }
  });

  await transaction_queue.onIdle();
};

let eth_block_height: number = 0;
let active_block_get = 0;
let active_tx_get = 0;
let last_block_index = 0;
let elapsed: number = 0;
let timer = getTime();

export const ethereum_block_transaction_scanning = async () => {
  let block_height = 0;
  try {
    logger.info(active.currentProvider);
    logger.info(await active.eth.getNodeInfo());
    block_height = (await active.eth.getBlockNumber()) - 1;
  } catch (e) {
    if (e) {
      // @ts-ignore
      logger.error(e.message);
      logger.error(`connection error:${ETH_URI}`);
    }
  }

  eth_block_height = block_height;

  const start_block: number = eth_block_height - 20000;
  const size: number = block_height;

  const block_range =
    size < block_height && start_block + size <= block_height
      ? getRange(start_block, size)
      : getRange(start_block, block_height - start_block); // ending block used instead of size

  const block_concurrency = 15;
  const tx_concurrency = 25;
  const block_queue = new PQueue({ concurrency: block_concurrency });

  process.on('SIGINT', () => {
    process.stdout.write(`\n`);
    const per_block = (block_range[block_range.length - 1] - block_range[0]) / elapsed;
    logger.info(
      `block range:${block_range[0]}=>${block_range[block_range.length - 1]}, ` +
        `last block fetch:${last_block_index}-${last_block_index + block_concurrency} (incr:${block_concurrency}), ` +
        `total blocks:${block_range[block_range.length - 1] - block_range[0]}`,
    );
    logger.info(
      `last block enqueue:${active_block_get}, ` +
        `last tx enqueue:${active_tx_get}, ` +
        `per block:${per_block} ms (${per_block / 1000} sec), ` +
        `total elapsed:${elapsed} secs`,
    );
    logger.info('received SIGINT, exiting gracefully');
    process.exit();
  });

  timer = getTime();

  for (let block_index = block_range[0]; block_index < block_range[block_range.length - 1]; ) {
    await block_queue.add(
      async () => await processBlockTransactions(getRange(block_index, block_concurrency), tx_concurrency),
    );
    last_block_index = block_index;
    block_index += block_concurrency;
    elapsed = getElapsed(timer);
  }

  block_queue.on('idle', (result: any) => {
    const total_blocks_processed = block_range[block_range.length - 1] - last_block_index;
    logger.info(
      `start_block:${block_range[0]} => end_block:${block_range[block_range.length - 1]}, size:${size} ` + `\n`,
    );
    logger.info(`block_concurrency:${block_concurrency}, tx_concurrency:${tx_concurrency}`);
    logger.info(`avg block processing time ${elapsed / total_blocks_processed} seconds`);
    !result ? process.exit() : logger.info(`${JSON.stringify}`) && process.exit();
  });
};

await (async () => {
  await ethereum_block_transaction_scanning();
})();
