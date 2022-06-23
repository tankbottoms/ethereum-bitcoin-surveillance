import moment from 'moment';
import { type } from './system';
import { logger } from '.';

export const useCall = (object: Object) => {
  return Object.prototype.toString.call(object).split(' ')[1].replace(/]/, '').toLowerCase();
};

export const typeof_examples = () => {
  // camel case AND pascal ugh
  false && process.stdout.write('\n');
  logger.info(`typeof null (typeof doesn't work) => ${typeof null}`);
  logger.info(
    `Object.prototype.toString.call... null => ` +
      `${Object.prototype.toString.call(null).split(' ')[1].replace(/]/, '').toLowerCase()}`,
  );
  false && process.stdout.write('\n');
  logger.info(
    `Object.prototype.toString.call...undefined => ` +
      `${Object.prototype.toString.call(undefined).split(' ')[1].replace(/]/, '').toLowerCase()}`,
  );
  logger.info(`typeof undefined => ${typeof undefined}`);
  false && process.stdout.write('\n');
  logger.info(`typeof [] => ${type([])}`);
  logger.info(`typeof {} => ${type({})}`);
  logger.info(
    `typeof function(){} => ${type(function () {
      undefined;
    })}`,
  );
  logger.info(`typeof 123 => ${type(12345)}`);
  // eslint-disable-next-line no-new-wrappers
  logger.info(`typeof new Number(123) => ${type(new Number(12345))}`);
  logger.info(`typeof /some_regex/ => ${type(/some_regex/)}`);
  logger.info(`typeof Symbol => ${type(Symbol('Symbolic'))}`);
  false && process.stdout.write('\n');
};

export const display_typeof_examples = () => {
  const thisFileName = __filename.split('/')[__filename.split('/').length - 1];
  logger.info(`${moment().format('YYYYMMDD-hhmmssSS')} ${thisFileName}...`);
  logger.info(`Examples of functions/use of typeOf`);
  typeof_examples();
  const functionPromise = () => new Promise(resolve => setTimeout(() => resolve({}), 1000));
  const functionAsync = async () => ({});
  logger.info('functionPromise', Object.prototype.toString.call(functionPromise));
  logger.info('functionAsync', Object.prototype.toString.call(functionAsync));
  logger.info(`${Object.prototype.toString.call(null).split(' ')[1].replace(/]/, '').toLowerCase()}`);
};
