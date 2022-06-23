// This whole file is only an IIFE, not wired up to anything else.
// is it used (should go in tools) or can it be deleted?

/* eslint-disable @typescript-eslint/no-floating-promises */
import { promisify } from 'util';
import Web3 from 'web3';
import { ETH_URI } from '../config';
import { PQueue } from '../p-queue';
import { BlockTransactionObject, BlockTransactionString } from '../types';
import { logger, Megabyte } from '../utils';

const web3: Web3 = new Web3(new Web3.providers.HttpProvider(ETH_URI));

export const getRange = (start: number, size: number): number[] => [...Array(size).keys()].map(i => start + i);

const start_time = Date.now();

const get_block_range_timed = async (block_size: number, concurrency: number): Promise<number> => {
  const end = await promisify(web3.eth.getBlockNumber)();
  let blocks: (BlockTransactionObject | null)[] = [];
  const start = end - block_size;
  let seconds = 0;

  logger.info(`timing the fetching of ${start} block to ${end} block, ${end - start} total blocks`);

  const block_range_queue = new PQueue({
    concurrency,
    interval: 50,
  });

  for (let i = start; i <= end; i++) {
    await block_range_queue.add(async () => {
      logger.debug(`queuing ${i} block`);
      blocks = await Promise.all([get_block(i)]);
    });
  }

  const end_time = Date.now();
  let time_difference = end_time - start_time; // in ms
  time_difference /= 1000;
  seconds = Math.round(time_difference);
  return seconds;
};

const get_block = async (block_number: number): Promise<any> => {
  const max_memory_usage_in_MB = process.memoryUsage().rss / Megabyte;
  const max_memory_concurrency_constant = 3500;
  const concurrency_ceiling = Math.ceil(max_memory_concurrency_constant / max_memory_usage_in_MB);
  const block_range_concurrency = concurrency_ceiling || 1;
  const block_range_queue = new PQueue({ concurrency: block_range_concurrency });

  let block: BlockTransactionString | null = null;
  let current_block = 0;
  if (Math.floor(max_memory_usage_in_MB) >= 750) process.exit(1);

  try {
    await block_range_queue.add(async () => {
      try {
        Math.floor(max_memory_usage_in_MB) >= 750 ? process.exit(1) : null;
        // @ts-ignore
        block = await web3?.eth.getBlock(block_number);
        current_block = block!.number;
      } catch (err) {
        return err;
      }
    });
    await block_range_queue.onIdle();
    logger.debug(`completed ${current_block} block fetch`);
    true && process.stdout.write('.');
    return block;
  } catch (e) {
    return e;
  }
};

(async () => {
  const test_range = { block_size: 1000, concurrency: 15 };
  const result = await get_block_range_timed(test_range.block_size, test_range.concurrency);

  logger.info(
    `the fetching of ${test_range.block_size} blocks using ` +
      `${test_range.concurrency} threads completed in ${result} seconds`,
  );
})();
