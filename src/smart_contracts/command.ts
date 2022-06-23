import { Arguments, InferredOptionTypes } from 'yargs';
import { activity } from './arguments';
import { logger } from '../utils';

export const command = 'smart_contracts';
export const describe = 'Perform operations on ETH smart contracts.';
export const builder = {
  activity,
};

export const handler = (argv: Arguments<InferredOptionTypes<typeof builder>>) => {
  logger.info(`${argv.task}`);
};
