import { Arguments, InferredOptionTypes } from 'yargs';
import { schedule, job_type, schedule_type, extraction_type, node_cron } from './arguments';
import { BitcoinProcessingOptions, EthereumProcessingOptions, JobType } from '../types';
import { schedule_cron_handler } from './cron';
// import { validate_schedule_arguments } from '../command/validate';
import { logger } from '../utils';

export const command = 'scheduler';
export const describe = 'Schedule application tasks.';
export const builder = {
  schedule,
  schedule_type,
  job_type,
  extraction_type,
  node_cron,
};

export const handler = async (argv: Arguments<InferredOptionTypes<typeof builder>>) => {
  const options: EthereumProcessingOptions | BitcoinProcessingOptions = {
    extraction_type: argv.extraction_type,
    start_block: -1,
    end_block: -1,
    size_block: -1,
    block_range: [],
    get_transactions: argv.extraction_type.includes('blocks'),
    job_id: '',
  };

  /*
  const updated_options = await validate_schedule_arguments(argv, options);
  */

  logger.debug(`${JSON.stringify(argv)}`);

  /*
  updated_options &&
    options.extraction_type === 'blocks_transactions' &&
    schedule_cron_handler(argv.schedule_type, argv.job_type, updated_options, argv.node_cron);
    */
};
