import { Arguments, InferredOptionTypes } from 'yargs';
import { settings } from './arguments';
import { logger } from '../utils';

export const command = 'config';
export const describe = 'Override .env configurations.';
export const builder = {
  settings,
};

export const handler = (argv: Arguments<InferredOptionTypes<typeof builder>>) => {
  logger.info(`${argv.settings}`);
};
