/* eslint-disable no-shadow */
// eslint-disable-next-line import/no-unassigned-import
import 'datejs';
import Web3 from 'web3';
import { ETH_URI } from '../config';
import { Dynamic, JobType } from '../types';
import { convert_date_range_to_eth_block_numbers, scan_eth_blocks } from '../ethereum/date';
import { logger } from '../utils';

const local_node = `http://192.168.1.55:8545`;
const web3: Web3 = new Web3(new Web3.providers.HttpProvider(local_node));

const get_block_timestamp = async (argv: string) => {
  let current_height = 10000,
    block,
    time;
  switch (argv) {
    case 'ethereum':
      current_height = await web3.eth.getBlockNumber();
      true && logger.info(`current height: ${current_height}`);
      block = await web3?.eth.getBlock(current_height, false);
      time = block.timestamp;
      return { time, current_height };
    default:
      throw new Error(`Unknown argv command ${argv}`);
  }
};

export const get_today_schedule = async (argv: string, now_date?: Date): Promise<number> => {
  logger.info(`get starting block for today ${argv} on ${now_date}`);
  let start_block = -1;
  const date_now = Date.today();
  const { time, current_height } = await get_block_timestamp(argv);
  const mid_night_date_time = date_now.add(-1).day().getTime();
  const target_start_date = mid_night_date_time / 1000;
  if (argv === JobType.ethereum) start_block = await scan_eth_blocks(time, target_start_date, current_height);
  logger.info(`start block => ${start_block}`);
  return start_block;
};

export const get_week_schedule = async (job_type: string, week_start?: string, week_end?: string) => {
  let block_range: { start_block: number; end_block: number } | undefined;
  const last_sunday = new Date().last().sunday().clearTime();
  const last_week_end = week_end ? week_end : last_sunday.toString('MM/dd/yyyy');
  const last_week_start = week_start ? week_start : last_sunday.addDays(-6).toString('MM/dd/yyyy');
  true && logger.info(`${last_week_start}, ${last_week_end}`);
  if (job_type === JobType.ethereum)
    block_range = await convert_date_range_to_eth_block_numbers(last_week_start, last_week_end);
  return block_range;
};

export const get_month_schedule = async (job_type: string, month_start?: string, month_end?: string) => {
  logger.info(`get month schedule for ${job_type}`);
  let block_range: { start_block: number; end_block: number } | undefined;
  const ld = new Date().last().month().clearTime().moveToLastDayOfMonth();
  const last_date = month_end ? month_end : ld.toString('MM/dd/yyyy');
  const fd = new Date().last().month().clearTime().moveToFirstDayOfMonth();
  const start_date = month_start ? month_start : fd.toString('MM/dd/yyyy');
  true && logger.info(` starting date:${start_date}, end date:${last_date}`);
  if (job_type === JobType.ethereum) block_range = await convert_date_range_to_eth_block_numbers(start_date, last_date);
  return block_range;
};

export const get_cron_schedule = async (job_type: string, node_cron: string) => {
  const numberPattern = /\d+/;
  const matches_array = node_cron.match(numberPattern);
  const search_term = matches_array ? matches_array[0] : '';
  const search_index = matches_array ? matches_array.index : -1;
  enum valid_index {
    daily = 2,
    weekly = 8,
    monthly = 4,
  }
  const validate_index =
    search_index !== valid_index.daily && search_index !== valid_index.weekly && search_index !== valid_index.monthly;
  if (validate_index) return;
  switch (search_index) {
    case valid_index.daily:
      const hour = Number(parseInt(search_term));
      if (hour > 24) return;
      const date_at_hour = Date.today().at(`${hour}:00`);
      const start_block = await get_today_schedule(job_type, date_at_hour);
      return start_block;
    case valid_index.weekly:
      const day = Number(parseInt(search_term));
      if (day > 7) return;
      const week_end = Date.today().clearTime().toString('MM/dd/yyyy');
      const week_start = Date.today().add(-7).days().clearTime().toString('MM/dd/yyyy');
      const week_block_range = await get_week_schedule(job_type, week_start, week_end);
      // get start block for the last 7 days
      return week_block_range;
    case valid_index.monthly:
      if (Number(search_term) > 12 || Number(search_term) < 0) return;
      // get start block for the last 31
      const month_range = month_select[search_term];
      const month_block_range = await get_month_schedule(job_type, month_range.start_date, month_range.end_date);
      return month_block_range;
    default:
      break;
  }
};

const get_date_range = (month: keyof month) => {
  const start_date = Date[month]().clearTime().moveToFirstDayOfMonth().toString('MM/dd/yyyy');
  const end_date = Date[month]().clearTime().moveToLastDayOfMonth().toString('MM/dd/yyyy');
  return { start_date, end_date };
};

type month = {
  january: Date;
  february: Date;
  march: Date;
  april: Date;
  may: Date;
  june: Date;
  july: Date;
  august: Date;
  september: Date;
  october: Date;
  november: Date;
  december: Date;
};

const month_select: Dynamic = {
  '1': get_date_range('january'),
  '2': get_date_range('february'),
  '3': get_date_range('march'),
  '4': get_date_range('april'),
  '5': get_date_range('may'),
  '6': get_date_range('june'),
  '7': get_date_range('july'),
  '8': get_date_range('august'),
  '9': get_date_range('september'),
  '10': get_date_range('october'),
  '11': get_date_range('november'),
  '12': get_date_range('december'),
};

async () => {
  const start_block = await get_today_schedule('ethereum');
  const blocks = await get_month_schedule(JobType.ethereum);
  const week = await get_week_schedule('ethereum');

  console.log(start_block);
  console.log(blocks);
  console.log(week);
};
