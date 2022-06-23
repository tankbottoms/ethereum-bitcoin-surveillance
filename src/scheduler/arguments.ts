// import { JobType } from '../types';

export const schedule = {
  alias: 's',
  describe: 'Specify the scheduling related task.',
  choices: ['list', 'add', 'remove', 'update'],
  type: 'string' as const,
  demandOption: true,
  default: 'list',
};

export const job_type = {
  alias: 'j',
  describe: 'Specify the job to run',
  choices: ['ethereum', 'bitcoin'],
  type: 'string' as const,
  demandOption: true,
  default: 'ethereum',
};

export const schedule_type = {
  alias: 't',
  describe: 'Specify the cron to run',
  choices: ['daily', 'monthly', 'weekly', 'cron'],
  type: 'string' as const,
  demandOption: true,
  default: 'cron',
};

export const extraction_type = {
  alias: ['type'],
  describe: 'Blockchain data to export.',
  choices: ['blocks_transactions', 'mempool', 'addresses'],
  type: 'string' as const,
  demandOption: true,
  default: 'blocks_transactions',
};

export const node_cron = {
  alias: 'n',
  describe: 'Specify the cron to run',
  type: 'string' as const,
  demandOption: true,
  default: '*1**',
};
