import moment from 'moment';
import Web3 from 'web3';
import { BlockRangeTimestamp } from '../types';
import { PQueue } from '../p-queue';
import { ETH_URI } from '../config';
import { is_date_same, logger } from '../utils';

export const active: Web3 = new Web3(new Web3.providers.HttpProvider(ETH_URI));
export const get_block_and_transactions = false;
export const approx_ethereum_blocks_per_day: number = 5760;

export const getRange = (start: number, size: number): number[] => {
  return [...Array(size).keys()].map(i => start + i);
};

export const scan_eth_blocks = async (
  estimated_time: number | string,
  target_timestamp: number,
  increment_block: number,
): Promise<any> => {
  try {
    const counter: number = approx_ethereum_blocks_per_day;
    let next_block_start = 0;
    const time = Number(estimated_time);
    let start_block;

    logger.debug(`estimated time start:${time} target timestamp:${target_timestamp}`);

    if (time < target_timestamp) {
      logger.debug(`timestamp requires increments`);
      false &&
        logger.info(
          `estimated:${moment.unix(time).format(`MM/DD/YYYY`)} ` +
            `target:${moment.unix(target_timestamp).format(`MM/DD/YYYY`)}`,
        );
      next_block_start = increment_block + counter;
      logger.debug(`incremented:${next_block_start}`);
      start_block = await active?.eth.getBlock(next_block_start, get_block_and_transactions);
      false &&
        logger.info(`incremented timestamp => ${moment.unix(Number(start_block.timestamp)).format(`MM/DD/YYYY`)}`);
      const estimate = new Date(moment.unix(Number(start_block.timestamp)).format(`MM/DD/YYYY`));
      const target_date = new Date(moment.unix(Number(target_timestamp)).format(`MM/DD/YYYY`));
      logger.debug(`estimated timestamp:${estimate}  target timestamp:${target_date}`);
      if (!is_date_same(estimate, target_date)) {
        const jump_week = 7;
        const jump_block = jump_week * counter;
        const diff_time = Number(start_block.timestamp) - target_timestamp;
        const time_diff_by_est_days = Math.floor(diff_time / (3600 * 24));
        logger.debug(`Δ(${time_diff_by_est_days})`);
        if (time_diff_by_est_days > jump_week) next_block_start = increment_block + counter + jump_block;
        else next_block_start = next_block_start + counter;
        return await scan_eth_blocks(start_block.timestamp, target_timestamp, next_block_start);
      }
    } else if (time > target_timestamp) {
      logger.debug(`timestamp requires decrements`);
      false &&
        logger.info(
          `estimated:${moment.unix(time).format(`MM/DD/YYYY`)} ` +
            `target:${moment.unix(target_timestamp).format(`MM/DD/YYYY`)}`,
        );
      next_block_start = increment_block - counter;
      logger.debug(`decremented:${next_block_start}`);
      start_block = await active?.eth.getBlock(next_block_start, get_block_and_transactions);
      false &&
        logger.info(`decremented timestamp => ${moment.unix(Number(start_block.timestamp)).format(`MM/DD/YYYY`)}`);
      const estimate = new Date(moment.unix(Number(start_block.timestamp)).format(`MM/DD/YYYY`));
      const target_date = new Date(moment.unix(Number(target_timestamp)).format(`MM/DD/YYYY`));
      logger.debug(`estimated timestamp => ${estimate}  target timestamp => ${target_date}`);
      if (!is_date_same(estimate, target_date)) {
        const jump_week = 7;
        const jump_block = jump_week * counter;
        const diff_time = Number(start_block.timestamp) - target_timestamp;
        const time_diff_by_est_days = Math.floor(diff_time / (3600 * 24));
        logger.debug(`Δ(${time_diff_by_est_days})`);
        if (time_diff_by_est_days > jump_week) next_block_start = increment_block - counter - jump_block;
        else next_block_start = increment_block - counter;
        return await scan_eth_blocks(start_block.timestamp, target_timestamp, next_block_start);
      }
    }

    return next_block_start;
  } catch (error) {
    return error;
  }
};

export const concurrency = true;

export const convert_date_range_to_eth_block_numbers = async (start_date: string, end_date: string) => {
  try {
    const current_height = (await active.eth.getBlockNumber()) - 1;
    const now = new Date().getTime();
    const start = new Date(start_date).getTime();
    const end = new Date(end_date).getTime();

    logger.info(`convert start unix timestamp:${start} and end unix timestamp:${end} to approx ethereum blocks`);
    logger.debug(`current height: ${current_height}`);

    if (start > end || end > now) return { start_block: -1, end_block: -1 }; // throw new Error('Bad parameter check start or end date');

    const diff_time = end - start;
    const time_diff_by_est_days = diff_time / (1000 * 3600 * 24);
    const block_count = time_diff_by_est_days * approx_ethereum_blocks_per_day;
    const block_start = current_height - block_count;

    const block = await active?.eth.getBlock(block_start, get_block_and_transactions);
    const { timestamp } = block;

    const target_start_date = start / 1000;
    const target_end_date = end / 1000;

    if (concurrency) {
      const time_queue = new PQueue({ concurrency: 1 });

      const start_block_number = await time_queue.add(() => scan_eth_blocks(timestamp, target_start_date, block_start));
      const end_block_number = await time_queue.add(() => scan_eth_blocks(timestamp, target_end_date, block_start));

      return {
        start_block: start_block_number,
        end_block: end_block_number,
      };
    } else {
      const start_block_number = await scan_eth_blocks(timestamp, target_start_date, block_start);
      const end_block_number = await scan_eth_blocks(timestamp, target_end_date, block_start);

      return {
        start_block: start_block_number,
        end_block: end_block_number,
      };
    }
  } catch (error) {
    logger.error(`${error}`);
    return { start_block: -1, end_block: -1 };
  }
};

export const eth_block_timestamp = async (block_number: number | undefined) => {
  if (typeof block_number === 'undefined') return undefined;
  const block = await active?.eth.getBlock(block_number, get_block_and_transactions);
  const { timestamp } = block;
  return moment.unix(Number(timestamp)).format(`MM/DD/YYYY`);
};

async () => {
  const block_range: BlockRangeTimestamp = {
    start_date: '06/12/2021',
    end_date: '07/02/2021',
    start_block: -1,
    end_block: -1,
  };

  const block_range_from_dates: any = await convert_date_range_to_eth_block_numbers(
    String(block_range.start_date),
    String(block_range.end_date),
  );
  block_range.start_block = block_range_from_dates.start_block;
  block_range.end_block = block_range_from_dates.end_block;
  logger.info(JSON.stringify(block_range));
  block_range.start_block !== -1 && block_range.end_block !== -1
    ? logger.info(
        `verify block timestamps:start_block: ${await eth_block_timestamp(block_range.start_block)}, ` +
          `end_block: ${await eth_block_timestamp(block_range.end_block)}`,
      )
    : null;
};
