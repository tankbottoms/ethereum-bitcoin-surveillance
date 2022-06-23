import moment from 'moment';
import { Web3Helper } from '../ethereum/web3';
import { Arguments, InferredOptionTypes } from 'yargs';
import {
  extraction_type,
  start_block,
  end_block,
  size_block,
  block_range_concurrency,
  block_concurrency,
  concurrency,
  from_date,
  to_date,
} from '../command/arguments';
import { BitcoinProcessingOptions, EthereumProcessingOptions, JobType, validate_block_by_number } from '../types';
import { convert_date_range_to_eth_block_numbers } from '../ethereum/date';
import { logger, getRange } from '../utils';
import { VERBOSE } from '../config';
import Web3 from 'web3';

export const builder = {
  extraction_type: extraction_type,
  start_block,
  end_block,
  size_block,
  from_date,
  to_date,
  block_range_concurrency,
  block_concurrency,
  concurrency,
};

export const validate_args = async (
  command: string,
  argv: Arguments<InferredOptionTypes<typeof builder>>,
  options: BitcoinProcessingOptions | EthereumProcessingOptions,
  current_height: number,
) => {
  logger.debug(`${JSON.stringify(argv)}`);
  const today = new Date().toLocaleDateString('en-GB');
  if (process.argv.length < 2) {
    logger.info(`invalid parameters use --help`);
    process.exit(0);
  }
  options.extraction_type = argv.extraction_type;
  if (options.extraction_type === 'mempool') return;

  if (argv.size_block === -1 && argv.start_block === -1 && argv.from_date === argv.to_date) {
    const week_ago_example = moment(new Date()).subtract(7, 'days').format('DD/MM/YYYY');
    if (options?.extraction_type === 'addresses') logger.info(`extraction_type of address required block range`);
    logger.info(`set start_block, end_block, size_block, from_date or to_date, exiting` + `\n`);
    logger.info(`${command} current height is ${current_height}`);
    logger.info(`${command} requires "--start_block" OR "--from_date"`);
    logger.info(`i.e., --start_block ${current_height - 120} --end_block ${current_height} # last two hours`);
    logger.info(`i.e., --from_date ${week_ago_example} --to_date ${today} # last week`);
    process.exit(0);
  } else if (argv.start_block === 0 || argv.start_block) {
    if (argv.end_block !== -1 && !validate_block_by_number(argv.start_block, argv.end_block)) {
      logger.error(`invalid start_block:${argv.start_block} or end_block:${argv.end_block}`);
      process.exit(0);
    }
    // genesis is zero.
    // if (argv.start_block === 0) {
    //   logger.error(`invalid start_block:${argv.start_block}, block start at 1`);
    //   process.exit(0);
    // }
  }

  if (argv.start_block !== -1 || argv.size_block !== -1) {
    options.end_block = argv.end_block !== -1 ? argv.end_block : current_height;
    options.start_block = argv.start_block !== -1 ? argv.start_block : options.end_block - argv.size_block;
    if (argv.size_block === -1) {
      logger.info(`computing size block`);
      options.size_block = options.end_block - options.start_block;
    } else {
      logger.info(`pulling from argv size ${argv.size_block}`);
      options.size_block = argv.size_block;
    }
    //options.size_block = argv.size_block !== -1 ? argv.size_block : options.end_block - options.start_block;
    logger.info(
      `start_block:${options.start_block} defined, ` +
        `computing end_block:${options.end_block} and size_block:${options.size_block}`,
    );

    options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
  } else if (argv.from_date) {
    let blocks;
    if (command === 'ethereum') {
      blocks = await convert_date_range_to_eth_block_numbers(argv.from_date, argv?.to_date ? argv.to_date : today);
    }
    options.start_block = blocks?.start_block;
    options.end_block = blocks?.end_block;
    options.size_block = blocks?.end_block - blocks?.start_block;
    options.block_range = options.start_block ? getRange(options.start_block, options.size_block) : [-1];
  }
  return options;
};
