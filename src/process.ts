import { logger } from './utils';

process.on('SIGTERM', () => {
  process.stdout.write(`\n`);
  logger.info('received SIGTERM, exiting gracefully');
  process.exit(0);
});
