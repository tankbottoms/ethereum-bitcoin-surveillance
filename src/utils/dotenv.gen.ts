/* eslint-disable no-void */
import { Dotenv } from './dotenv';
import { VERBOSE } from '../config';

const printProcessEnvironment = async () => {
  const ENV_VARIABLES = Array.from(Object.keys(process.env));
  VERBOSE && console.info(`The following environment variables are defined:`);
  VERBOSE && console.info(ENV_VARIABLES.sort() + `\n`);
};

void (async () => {
  !VERBOSE && printProcessEnvironment();
  Dotenv.getInstance();
  Dotenv.generateTemplateAndSave();
  Dotenv.print();
});
