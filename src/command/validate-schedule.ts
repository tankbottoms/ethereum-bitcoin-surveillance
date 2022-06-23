import Web3 from 'web3';
import { BitcoinProcessingOptions, EthereumProcessingOptions, JobType } from '../types';
import { get_cron_schedule, get_month_schedule, get_today_schedule, get_week_schedule } from '../scheduler/date';
import { logger, getRange } from '../utils';
import { BTC_NODE_IP, BTC_NODE_PASSWORD, BTC_NODE_PORT, BTC_NODE_USER, BTC_RPC_TIMEOUT } from '../config';
import { RPCClient } from 'rpc-bitcoin';

const btc_options = {
  url: `http://${BTC_NODE_IP}`,
  port: parseInt(`${BTC_NODE_PORT}`),
  timeout: BTC_RPC_TIMEOUT,
  user: BTC_NODE_USER,
  pass: BTC_NODE_PASSWORD,
};

export const btc_client: RPCClient = new RPCClient(btc_options);

const validate_schedule_arguments = async (
  argv: any,
  options: EthereumProcessingOptions | BitcoinProcessingOptions,
) => {
  let current_height = 0;
  const local_node = `http://192.168.1.55:8545`; // TODO
  const web3: Web3 = new Web3(new Web3.providers.HttpProvider(local_node));

  if (argv.job_type === JobType.bitcoin) current_height = await btc_client.getblockcount();
  if (argv.job_type === JobType.ethereum) current_height = await web3.eth.getBlockNumber();

  switch (argv.schedule_type) {
    case 'daily':
      const start = await get_today_schedule(argv.job_type);
      options.end_block = current_height;
      options.start_block = start;
      options.size_block = current_height - start;
      logger.info(
        `start_block:${options.start_block} daily ` +
          `computing end_block:${options.end_block} and size_block:${options.size_block}`,
      );
      options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
      break;
    case 'weekly':
      const week_range = await get_week_schedule(argv.job_type);
      options.end_block = week_range?.end_block ? week_range?.end_block : -1;
      options.start_block = week_range?.start_block ? week_range?.start_block : -1;
      options.size_block = options.end_block - options.start_block;
      logger.info(
        `start_block:${options.start_block} weekly, ` +
          `computing end_block:${options.end_block} and size_block:${options.size_block}`,
      );
      options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
      break;
    case 'monthly':
      const month_range = await get_month_schedule(argv.job_type);
      options.end_block = month_range?.end_block ? month_range?.end_block : -1;
      options.start_block = month_range?.start_block ? month_range?.start_block : -1;
      options.size_block = options.end_block - options.start_block;
      logger.info(
        `start_block:${options.start_block} monthly, ` +
          `computing end_block:${options.end_block} and size_block:${options.size_block}`,
      );
      options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
      break;
    default:
      const date_range = await get_cron_schedule(argv.job_type, argv.node_cron);
      if (typeof date_range === 'number') {
        const block_start = date_range;
        options.end_block = current_height;
        options.start_block = block_start;
        options.size_block = current_height - block_start;
        logger.info(
          `start_block:${options.start_block} daily ` +
            `computing end_block:${options.end_block} and size_block:${options.size_block}`,
        );
        options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
      } else if (date_range?.start_block !== undefined && date_range?.end_block !== undefined) {
        options.end_block = date_range?.end_block ? date_range?.end_block : -1;
        options.start_block = date_range?.start_block ? date_range?.start_block : -1;
        options.size_block = options.end_block - options.start_block;
        logger.info(
          `start_block:${options.start_block} monthly, ` +
            `computing end_block:${options.end_block} and size_block:${options.size_block}`,
        );
        options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
      }
      break;
  }
  return options;
};
