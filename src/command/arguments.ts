import moment from 'moment-timezone';

export const extraction_type = {
  alias: ['type'],
  describe: 'Blockchain data to extract.',
  choices: ['blocks_transactions', 'mempool', 'addresses'],
  type: 'string' as const,
  default: 'blocks_transactions',
};

export const start_block = {
  alias: ['start'],
  describe: `The block number to extract from.`,
  type: 'number' as const,
  default: 0,
};

export const end_block = {
  alias: ['end'],
  describe: `The block number to extract until.`,
  type: 'number' as const,
  default: -1,
};

export const size_block = {
  alias: ['size'],
  describe: `The number of consecutative blocks from start_block.`,
  type: 'number' as const,
  default: -1,
};

export const block_range_concurrency = {
  alias: ['block_range'],
  describe: 'Number of block chunks to run in parallel.',
  type: 'number' as const,
  default: 10,
};

export const block_concurrency = {
  alias: ['block'],
  describe: 'Number of block to fetch in parallel.',
  type: 'number' as const,
  default: 15,
};

export const transaction_concurrency = {
  alias: ['transaction'],
  describe: 'Number of transactions to fetch run in parallel.',
  type: 'number' as const,
  default: 10,
};

export const get_transactions = {
  alias: 'tx',
  describe: 'Get block transactions',
  type: 'boolean' as const,
  default: true,
};

export const from_date = {
  alias: 'f',
  describe: 'The starting date of the range of data to fetch. Defaults to current date - 1 month.',
  type: 'string' as const,
  default: moment().startOf('day').subtract(1, 'month').toString(),
  coerce: (arg: Date) => moment.utc(arg, 'MM/DD/YYYY').startOf('day').toString(),
};

export const to_date = {
  alias: 't',
  describe: 'The starting date of the range of data to fetch. Defaults to the current date.',
  type: 'string' as const,
  default: moment().startOf('day').toString(),
  coerce: (arg: Date) => moment.utc(arg, 'MM/DD/YYYY').startOf('day').toString(),
};

export const force = {
  alias: 's',
  describe: 'Force command to run, regardless of job_history.',
  type: 'boolean' as const,
  default: false,
};

export const concurrency = {
  alias: 'c',
  describe: 'Number of operations to run in parallel. Default 10.',
  default: 10,
  type: 'number' as const,
};
