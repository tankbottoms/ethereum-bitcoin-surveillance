import { Arguments, InferredOptionTypes } from 'yargs';
import { Web3Helper } from './web3';
import { EthereumProcessingOptions } from '../types';
import { validate_args } from '../command/validate';
import {
  extraction_type,
  start_block,
  end_block,
  size_block,
  block_range_concurrency,
  block_concurrency,
  transaction_concurrency,
  get_transactions,
  concurrency,
  from_date,
  force,
  to_date,
} from '../command/arguments';
import { ethereum_handler } from './handler';
import { ethereum_mempool_handler } from './mempool-handler';
import { logger } from '../utils';

export const command = 'ethereum';
export const describe = 'Extract data from an ETH Node via RPC commands.';
export const builder = {
  extraction_type: extraction_type,
  start_block,
  end_block,
  size_block,
  from_date,
  to_date,
  block_range_concurrency,
  block_concurrency,
  transaction_concurrency,
  concurrency,
  force,
  get_transactions,
};

export const handler = async (argv: Arguments<InferredOptionTypes<typeof builder>>) => {
  const current_height = await Web3Helper.getHandle().eth.getBlockNumber();

  const options: EthereumProcessingOptions = {
    extraction_type: argv.extraction_type,
    block_range: [],
    start_block: argv.start_block,
    size_block: argv.size_block,
    end_block: argv.end_block,
    from_date: argv.from_date,
    to_date: argv.to_date,
    block_range_concurrency: argv.block_range_concurrency,
    block_concurrency: argv.block_concurrency,
    transaction_concurrency: argv.transaction_concurrency,
    concurrency: argv.concurrency,
    get_transactions: argv.get_transactions,
    job_id: '',
    force: argv.force,
  };

  options.extraction_type === 'mempool'
    ? await ethereum_mempool_handler({ extraction_type: options.extraction_type, verbosity: true })
    : null;

  const updated_options = await validate_args(command, argv, options, current_height);

  //updated_options ? logger.trace(`ethereum arguments => ${JSON.stringify(updated_options)}`) : null;

  updated_options && options.extraction_type === 'blocks_transactions' ? await ethereum_handler(updated_options) : null;
};
