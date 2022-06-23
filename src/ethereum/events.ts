import EventEmitter from 'events';
import { logger } from '../utils';
import { set_job_state_handler } from './handler';

interface EthereumCallbacks {
  started: () => void;
  ended: () => void;
  noop: (args: any) => void;
  set_job_state: (args: any) => void;
  block: (args: any) => void;
  transaction: (args: any) => void;
  transactions: (args: any) => void;
  verify_block_range: (args: any) => void;
}
export type EthereumCallbackKeys = keyof EthereumCallbacks;

export class EthereumEvents extends EventEmitter {
  private static instance: EthereumEvents;

  EthereumEvents: EthereumCallbackKeys = 'noop';

  constructor() {
    super();
  }

  static getInstance = () => {
    if (!EthereumEvents.instance) EthereumEvents.instance = new EthereumEvents();
    return EthereumEvents.instance;
  };

  on<T extends keyof EthereumCallbacks>(event: T, listener: EthereumCallbacks[T]): this {
    return super.on(event, listener);
  }

  emit<T extends keyof EthereumCallbacks>(event: T, ...args: Parameters<EthereumCallbacks[T]>) {
    return super.emit(event, ...args);
  }

  emitObject(event: any, obj = {}) {
    const emit = EthereumEvents.getInstance().emit(event, obj);
    console.log(emit, 'emit');

    return obj;
  }
}

export class EthereumDispatcher {
  constructor() {
    const ee = EthereumEvents.getInstance();
    ee.on('started', () => {
      logger.info('EthereumEvents started.');
    });
    ee.on('ended', () => {
      logger.info('EthereumEvents ended.');
    });
    ee.on('set_job_state', async args => {
      logger.debug(`${JSON.stringify(args)}`);
      await set_job_state_handler(args);
    });
    ee.on('block', async args => {
      const { block, handler } = args;
      await handler(block);
    });
    ee.on('transaction', async args => {
      const { transaction, handler } = args;
      await handler(transaction);
    });
    ee.on('transactions', async args => {
      const { transactions, handler } = args;
      await handler(transactions);
    });
    ee.on('verify_block_range', async args => {
      const { block_range, handler } = args;
      await handler(block_range);
    });
  }
}

export class EthereumNodeSpeedrunEventHandler {
  events: EthereumEvents;

  dispatcher: EthereumDispatcher;

  constructor() {
    this.events = new EthereumEvents();
    this.dispatcher = new EthereumDispatcher();
  }
}
