import { EthereumEvents, EthereumNodeSpeedrunEventHandler } from './events';

async () => {
  const ev: EthereumNodeSpeedrunEventHandler = new EthereumNodeSpeedrunEventHandler();
  EthereumEvents.getInstance().emit('started');
  EthereumEvents.getInstance().emit('ended');
  EthereumEvents.getInstance().emit('noop', ev);
};
