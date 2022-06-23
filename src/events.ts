/* eslint-disable no-void */
import EventEmitter from 'events';
import { logger } from './utils';

interface AppCallbacks {
  started: () => void;
  ended: () => void;
  noop: () => void;
  template: (args: any) => void;
  timeout: (args: any) => void;
  unspecified_error: (args: any) => void;
}

type AppCallbackKeys = keyof AppCallbacks;

export class AppEvents extends EventEmitter {
  private static instance: AppEvents;
  AppEvents: AppCallbackKeys = 'noop';

  constructor() {
    super();
  }

  static getInstance = () => {
    if (!AppEvents.instance) AppEvents.instance = new AppEvents();
    return AppEvents.instance;
  };

  on<T extends keyof AppCallbacks>(event: T, listener: AppCallbacks[T]): this {
    return super.on(event, listener);
  }
  emit<T extends keyof AppCallbacks>(event: T, ...args: Parameters<AppCallbacks[T]>) {
    return super.emit(event, ...args);
  }
}

export class AppDispatcher {
  constructor() {
    AppEvents.getInstance().on('started', () => {
      this.started();
    });
    AppEvents.getInstance().on('ended', () => {
      this.ended();
    });
    AppEvents.getInstance().on('noop', () => {
      this.noop();
    });
    AppEvents.getInstance().on('unspecified_error', args => {
      void this.unspecified_error(args);
    });
    AppEvents.getInstance().on('timeout', args => {
      void this.timeout(args);
    });
  }

  started = () => {
    logger.info(`AppEvents: started callback.`);
  };
  ended = () => {
    logger.info(`AppEvents: ended callback.`);
  };
  noop = () => {
    logger.info(`AppEvents: noop callback.`);
  };

  template = async (args: any) => {
    logger.info(`AppEvents(template):${JSON.stringify(args)}`);
  };

  timeout = async (args: any) => {
    logger.info(`AppEvents(timeout):${JSON.stringify(args)}`);
  };
  unspecified_error = async (args: any) => {
    logger.error(`AppEvents(unspecified_error):${JSON.stringify(args)}`);
  };
}
