/* eslint-disable @typescript-eslint/no-floating-promises */
import yargs from 'yargs';
import * as testCommand from './test/command';
import * as ethereumCommand from './ethereum/command';
import * as smartContractsCommand from './smart_contracts/command';
import * as configurationCommand from './config/command';
import * as scheduleCommand from './scheduler/command';
import { logger } from './utils';

const this_filename = __filename.slice(__dirname.length + 1);

(async () => {
  // .command(smartContractsCommand)
  // .wrap(yargs.terminalWidth())
  // .command(scheduleCommand)
  // .wrap(yargs.terminalWidth())
  yargs
    // .command(testCommand)
    // .wrap(yargs.terminalWidth())
    // .command(configurationCommand)
    // .wrap(yargs.terminalWidth())
    .command(ethereumCommand)
    .wrap(yargs.terminalWidth()).argv;

  process.argv.length < 2 ? logger.info(`For instructions run: ${this_filename} --help`) : null;
})();
