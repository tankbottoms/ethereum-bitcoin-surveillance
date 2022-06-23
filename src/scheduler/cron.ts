import cron from 'node-cron';
import { ethereum_handler } from '../ethereum/handler';
import { BitcoinProcessingOptions, EthereumProcessingOptions, JobType } from '../types';

export const schedule_cron_handler = async (
  schedule_type: string,
  job_type: string,
  options: EthereumProcessingOptions | BitcoinProcessingOptions,
  node_cron?: string,
) => {
  const handler = ethereum_handler;
  switch (schedule_type) {
    case 'daily':
      cron.schedule('* 23 * * *', async () => {
        await handler(options);
      });
      break;
    case 'weekly':
      cron.schedule('* * * * 7', async () => {
        await handler(options);
      });
      break;
    case 'monthly':
      await handler(options);
      cron.schedule('* * 1 * *', async () => {
        await handler(options);
      });
      break;
    default:
      node_cron &&
        cron.schedule(node_cron, async () => {
          await handler(options);
        });
      break;
  }
};
