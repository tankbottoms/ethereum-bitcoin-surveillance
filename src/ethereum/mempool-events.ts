/* eslint-disable no-void */
/* eslint-disable max-len */
import EventEmitter from 'events';
import { logger } from '../utils';

interface EthereumMempoolCallbacks {
  started: () => void;
  ended: () => void;
  noop: (args: any) => void;
  mempool: (args: any) => void;
}

export type EthereumMempoolCallbackKeys = keyof EthereumMempoolCallbacks;

export class EthereumMempoolEvents extends EventEmitter {
  private static instance: EthereumMempoolEvents;
  EthereumEvents: EthereumMempoolCallbackKeys = 'noop';

  constructor() {
    super();
  }

  static getInstance = () => {
    if (!EthereumMempoolEvents.instance) EthereumMempoolEvents.instance = new EthereumMempoolEvents();
    return EthereumMempoolEvents.instance;
  };

  on<T extends keyof EthereumMempoolCallbacks>(event: T, listener: EthereumMempoolCallbacks[T]): this {
    return super.on(event, listener);
  }
  emit<T extends keyof EthereumMempoolCallbacks>(event: T, ...args: Parameters<EthereumMempoolCallbacks[T]>) {
    return super.emit(event, ...args);
  }
}

export class EthereumMempoolDispatcher {
  constructor() {
    EthereumMempoolEvents.getInstance().on('started', () => {
      this.started();
    });
    EthereumMempoolEvents.getInstance().on('ended', () => {
      this.ended();
    });
    EthereumMempoolEvents.getInstance().on('noop', args => {
      this.noop(args);
    });
    // eslint-disable-next-line no-void
    EthereumMempoolEvents.getInstance().on('mempool', args => {
      void this.mempool(args);
    });
  }

  started = () => {
    logger.info(`EthereumMempoolEvents started.`);
  };
  ended = () => {
    logger.info(`EthereumMempoolEvents ended.`);
  };
  noop = (args: any) => {
    logger.info(`EthereumMempoolEvents noop. ${JSON.stringify(args)}`);
  };

  mempool = async (args: any) => {
    true && logger.info(`Mempool => ${JSON.stringify(args)}`);
    /* 
    const { block, handler } = args;
    await handler(block);
    */
  };
}

export class EthereumMempoolEventHandler {
  events: EthereumMempoolEvents;
  dispatcher: EthereumMempoolDispatcher;
  constructor() {
    this.events = new EthereumMempoolEvents();
    this.dispatcher = new EthereumMempoolDispatcher();
  }
}
