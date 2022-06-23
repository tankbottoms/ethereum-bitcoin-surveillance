import Web3 from 'web3';
import { assert } from 'console';
import { PQueue } from '../p-queue';
import { ETH_URI, EXCLUDE_TRANSACTIONS } from '../config';
import { BlockTransactionObject, EthereumProcessingOptions, JobStatus, JobState, JobHistory, Dynamic } from '../types';
import { EthereumEvents, EthereumDispatcher } from './events';
import { block_handler, block_range_handler, transactions_handler } from './handler';
import { logger, zeroPad, deepCopy, numberWithCommas, SetEx, Megabyte } from '../utils';
import { get_fs_job_state, empty_error_blocks, remove_current_blocks, completed_status } from '../cache/job-state';
import { get_fs_job_history, update_fs_job_history } from '../cache/job-history';

// const local_node = `http://52.21.97.126:8545`;
const web3: Web3 = new Web3(new Web3.providers.HttpProvider('http://3.210.181.231:8545/'));

export const getTime = () => Date.now();
export const getElapsed = (now: number) => Date.now() - now;

let rewind_block_count = 0;
let current_block_index = 0;
let current_transaction = 0;
let elapsed_time = 0;
let counter = 0;

export const getRange = (start: number, size: number): number[] => [...Array(size).keys()].map(i => start + i);

export class EthereumNodeEventHandler {
  events: EthereumEvents;
  dispatcher: EthereumDispatcher;
  constructor() {
    this.events = new EthereumEvents();
    this.dispatcher = new EthereumDispatcher();
  }
}

const event_dispatcher = new EthereumNodeEventHandler();
logger.debug('ethereum event callback, dispatacher and handler initialized');

export const processBlockTransactions = async (
  block_range: number[],
  max_concurrency: number,
  get_transactions: boolean,
  ending_block?: number,
): Promise<any> => {
  const start_block = block_range[0];
  const end_block = block_range[block_range.length - 1];
  const index_length_ux = String(end_block).length;
  const max_memory_usage_in_MB = process.memoryUsage().rss / Megabyte;
  const max_memory_concurrency_constant = 3500;
  const concurrency_ceiling = Math.ceil(max_memory_concurrency_constant / max_memory_usage_in_MB);
  const block_range_concurrency = concurrency_ceiling || max_concurrency;
  const block_range_queue = new PQueue({ concurrency: block_range_concurrency });

  block_range.forEach(async block_index => {
    try {
      counter++;
      if (ending_block && block_index > ending_block) return;
      await block_range_queue.add(async () => {
        const timer = getTime();
        try {
          // Math.floor(max_memory_usage_in_MB) >= 750 ? process.exit(1) : null;
          const block = await web3?.eth.getBlock(block_index, get_transactions);
          EthereumEvents.getInstance().emit('set_job_state', {
            status: 'update_start_block',
            current_block: block.number,
          });
          current_block_index = block_index; // SIGNINT
          let { transactions, hash, gasUsed } = block;
          EthereumEvents.getInstance().emit('block', { block: { ...block }, handler: block_handler });
          let contracts = transactions.filter((tx: any) => tx.from && tx.to === null);
          elapsed_time += getElapsed(timer);
          logger.info(
            `(${numberWithCommas(zeroPad(block_index, index_length_ux))}) hash:${hash}, ts:${block?.timestamp},` +
              ` tx:${transactions.length}, sol:${contracts.length}, ` +
              `gas:${gasUsed},` +
              ` threads:${block_range_concurrency},` +
              ` (${getElapsed(timer)} ms) (memory:${Math.floor(max_memory_usage_in_MB)} MB)`,
          );

          get_transactions && transactions.length > 0
            ? EthereumEvents.getInstance().emit('transactions', {
                blockNumber: block_index,
                transactions,
                handler: transactions_handler,
              })
            : null;

          if (get_transactions && transactions.length > 0) {
            transactions.forEach((transaction: any) => {
              // @ts-ignore
              const { blockNumber, transactionIndex, input, from, to, value, gas, gasPrice } = transaction;
              transactionIndex ? (current_transaction = transactionIndex) : null; // SIGNINT
              assert(blockNumber === block_index);
              to === null ? logger.debug('\t' + `(${transactionIndex}) ${from} => size:${input.length}`) : null;
            });
          }
          transactions = [];
          contracts = [];
          hash = '';
          gasUsed = 0;
          // EthereumEvents.getInstance().emit('verify_block_range', { block_range, handler: block_range_handler });
          await Promise.resolve('completed');
          /*
          gasUsed = 0;
          EthereumEvents.getInstance().emit('verify_block_range', { block_range, handler: block_range_handler });          
          await Promise.resolve('completed');
          */
        } catch (err) {
          console.log(err);

          EthereumEvents.getInstance().emit('set_job_state', { status: 'error', block_number: block_index });
        }
      });
    } catch (e) {
      logger.error('\t' + `(${current_block_index}) ${e}` + '\n');
      EthereumEvents.getInstance().emit('set_job_state', { status: 'error', block_number: current_block_index });
      return e;
    }

    block_range_queue.on('active', () => {
      false &&
        logger.info(
          `${start_block}-${end_block}, ` + `size:${block_range_queue.size}, pending:${block_range_queue.pending}`,
        );
    });
  });

  await block_range_queue.onIdle();
  // eslint-disable-next-line no-param-reassign
  block_range = [];
};

export const ethereum_get_block_range_concurrency = async (options: EthereumProcessingOptions) => {
  let timer = getTime();
  let starting_block = options.start_block;
  let ending_block = options.end_block;
  const get_transactions =
    options.get_transactions !== undefined ? options.get_transactions : EXCLUDE_TRANSACTIONS === 'true';

  console.log(options);
  // Ethereum options defaults to the last 100k blocks (will update to the last months block range)
  const size = options.size_block;
  let block_range = options.block_range;

  let block_range_concurrency = options.block_range_concurrency ? options.block_range_concurrency : 15;
  const block_concurrency = options.transaction_concurrency ? options.transaction_concurrency : 25;

  rewind_block_count = Math.ceil(block_range_concurrency * block_concurrency);
  const block_range_queue = new PQueue({ concurrency: block_range_concurrency });

  logger.info(
    `start_block:${numberWithCommas(starting_block)} end_block:${numberWithCommas(
      starting_block + size,
    )} (${numberWithCommas(size)}), ` +
      `block_range_concurrency:${block_range_concurrency}, block_concurrency:${block_concurrency}, rewind_size:${rewind_block_count}` +
      '\n',
  );

  timer = getTime();

  if (block_range.length < block_range_concurrency) {
    const disabled_concurrency = 1;
    let block_counter = 0;
    block_range.forEach(async b => {
      await block_range_queue.add(async () => processBlockTransactions([b], disabled_concurrency, get_transactions));
      block_counter++;
      current_block_index = block_counter;
      elapsed_time = getElapsed(timer);
    });
  } else {
    starting_block = block_range[0];
    ending_block = block_range[block_range.length - 1];
    block_range = [];
    for (let block_index = starting_block; block_index < ending_block; ) {
      const current_memory_usage_in_MB = process.memoryUsage().rss / Megabyte;
      const max_memory_allowance = 3500;
      const adjusted_concurrency_by_memory_usage = Math.ceil(max_memory_allowance / current_memory_usage_in_MB);
      block_range_concurrency = adjusted_concurrency_by_memory_usage || 1;
      await block_range_queue.add(
        async () =>
          await processBlockTransactions(
            getRange(block_index, block_range_concurrency),
            block_concurrency,
            get_transactions,
            ending_block,
          ),
      );
      current_block_index = block_index;
      block_index += block_range_concurrency;
    }
  }

  block_range_queue.on('idle', async (result: any) => {
    const total_blocks_processed = ending_block - current_block_index;
    logger.info(
      `${options.job_id} start_block:${numberWithCommas(starting_block)} - end_block:${numberWithCommas(
        ending_block,
      )}, size:${numberWithCommas(size)}`,
    );
    logger.info(`block_range concurrency:${block_range_concurrency}, block concurrency:${block_concurrency}`);
    logger.info(`avg block processing time ${elapsed_time / total_blocks_processed} seconds`);
    result ? process.exit() : logger.info('') && process.exit();
  });

  const save_state = () => {
    process.stdout.write('\n');
    const per_block = (ending_block - starting_block) / elapsed_time;
    const possible_block_index = current_block_index - rewind_block_count;
    const rewind_block_save_state = possible_block_index < starting_block ? starting_block : possible_block_index;

    EthereumEvents.getInstance().emit('set_job_state', {
      status: 'update_start_block',
      current_block: rewind_block_save_state,
      ending_block,
    });
    logger.info(
      `block_queue encountered an error. block_index:${numberWithCommas(current_block_index)}, ` +
        `end_block:${numberWithCommas(ending_block)}, compensating for rewind current_block:${numberWithCommas(
          rewind_block_save_state,
        )}`,
    );
    logger.info(
      `block range:${numberWithCommas(starting_block)} - ${numberWithCommas(ending_block)}, ` +
        `last block fetch:${numberWithCommas(current_block_index)} - ${numberWithCommas(
          current_block_index + block_range_concurrency,
        )} ` +
        `(increment by ${block_range_concurrency} blocks), ` +
        `total blocks:${numberWithCommas(ending_block - starting_block + 1)}`,
    ); // zero-th index
    logger.info(
      `last block enqueue:${numberWithCommas(current_block_index)}, ` +
        `last transaction enqueue:${current_transaction}, ` +
        `per block:${per_block} ms (${per_block / 1000} sec), ` +
        `total elapsed:${elapsed_time} secs`,
    );
  };

  const dump_memory_usage = () => {
    const memory_usage = process.memoryUsage();
    logger.info(`${JSON.stringify(memory_usage)}`);
  };

  process.on('SIGINT', () => {
    save_state();
    logger.info('received SIGINT, exiting gracefully');
    process.exit();
  });

  process.on('SIGHUP', () => {
    save_state();
    logger.info('received SIGHUP, exiting gracefully');
    process.exit();
  });

  process.on('SIGTERM', () => {
    save_state();
    logger.info('received SIGTERM, exiting gracefully');
    process.exit();
  });
};

export const ethereum_speedrun_get_block_range_with_options = async (options: EthereumProcessingOptions) => {
  let job_state = {} as JobState | null;
  let job_history = {} as JobHistory | null;
  const error_blocks: number[] = [];
  job_state = {
    job_id:
      web3.utils.sha3(
        JSON.stringify({
          start_block: options.start_block,
          end_block: options.end_block,
          size: options.size_block,
        }),
      ) || '',
    status: JobStatus.STARTING,
    current_block: 0,
    end_block: options.end_block,
    size_block: options.end_block - options.start_block,
    error_blocks,
    timestamp: Date.now(),
  };

  job_history = {
    job_id:
      web3.utils.sha3(
        JSON.stringify({
          start_block: options.start_block,
          end_block: options.end_block,
          size: options.size_block,
        }),
      ) || '',
    status: JobStatus.STARTING,
    timestamp: Date.now(),
  };

  let history = await get_fs_job_history(job_history);
  if (history && history.status === JobStatus.COMPLETED && options.force === false) {
    logger.info(`job_id:${job_history.job_id} at timestamp:${history.timestamp} completed successfully`);
    // process.exit(0);
  }
  const state = await get_fs_job_state(job_state);
  logger.debug(`${JSON.stringify(Object.entries(state))}`);
  // console.log(state);
  if (state.job_id === job_state.job_id) {
    if (state.error_blocks && state.error_blocks.length > 0) {
      const updated_size = state.end_block - state.current_block;
      const original_block_range = getRange(state.current_block, updated_size);
      const updated_block_range = new SetEx(error_blocks);
      updated_block_range.merge(original_block_range);
      options.start_block = state.current_block;
      options.end_block = state.end_block;
      options.block_range = Array.from(updated_block_range);
      options.size_block = Array.from(updated_block_range).length + 1;
      await empty_error_blocks();
      logger.info(
        `Number of error blocks:${state.error_blocks.length}, ` +
          `previous current index:${options.start_block}, end_block:${options.end_block}, ` +
          `updated block_range:${options.block_range.length}`,
      );
    }

    if (state.current_block) {
      const start_block = state.current_block;
      const { end_block } = state;
      options.start_block = start_block;
      options.end_block = end_block;
      options.size_block = end_block - start_block;
      options.block_range = getRange(start_block, options.size_block);
      await remove_current_blocks();
      logger.info(
        `process terminated at block:${numberWithCommas(start_block)}, restored options starting:${numberWithCommas(
          options.start_block,
        )}, ` +
          `and size_block:${numberWithCommas(options.block_range.length)} or end_block:${numberWithCommas(
            options.end_block,
          )}`,
      );
    }
  }

  process.stdin.resume();

  process.on('SIGINT', async function () {
    const average_time_taken = elapsed_time / counter;
    const estimated_time_per_block = (average_time_taken / 1000).toFixed(4);
    const estimated_time_for_hundred_thousand = Math.ceil((average_time_taken * 100000) / (1000 * 60)).toFixed(2);
    const eth_height = await web3.eth.getBlockNumber();
    const estimated_time_for_eth_blockchain_fetch = Math.ceil(
      (average_time_taken * eth_height) / (1000 * 60 * 60),
    ).toFixed(2);

    logger.info(
      `time estimates for eth blocks & transactions => one (1) block ` +
        `${estimated_time_per_block} secs, ` +
        `hundred thousand (100,000) blocks ${estimated_time_for_hundred_thousand} mins or ${Math.ceil(
          parseInt(estimated_time_for_hundred_thousand) / 60,
        )} hours.`,
    );
    logger.info(
      `time estimate to extract the entire eth blockchain => ` +
        `${estimated_time_for_eth_blockchain_fetch} hours or ${
          parseInt(estimated_time_for_eth_blockchain_fetch) / 24
        } days.`,
    );
    EthereumEvents.getInstance().emit('verify_block_range', {
      block_range: { start_block: options.start_block, end_block: options.end_block },
      handler: block_range_handler,
    });
    process.exit();
  });

  const modified_options = deepCopy(options);
  delete modified_options.block_range;
  options.job_id = job_history.job_id;
  logger.debug(`options:${JSON.stringify(modified_options)}, block_range size:${options.block_range.length}`);
  true && (await ethereum_get_block_range_concurrency(options));
  history = [];
  job_history = null;
  job_state = null;
  //options.block_range = [];
  const sha = web3.utils.sha3(options.toString());
  logger.info(`unique job id generated from options:${sha}`);
  await completed_status();
  await update_fs_job_history(options.job_id);
  EthereumEvents.getInstance().emit('verify_block_range', {
    block_range: options.block_range, //{ start_block: options.start_block, end_block: options.end_block },
    handler: block_range_handler,
  });
};
