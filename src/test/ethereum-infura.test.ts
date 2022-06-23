import Web3 from 'web3';
import { WebsocketProvider, provider } from 'web3-core';
import { Web3ProviderLike } from '../types';
import { logger } from '../utils';

import { INFURA_API_KEY, INFURA_HTTPS, INFURA_WS } from '../config';
import { ARGENT_WALLET, MEOW_CONTRACT } from '../config/addresses';

export const eth_infura_http_ws = async (): Promise<Web3> => {
  const options = {
    timeout: 30000, // ms
    // headers: { authorization: 'user:password' },
    clientConfig: {
      maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
      keepalive: true,
      keepaliveInterval: 60000, // ms
    },
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false,
    },
  };

  logger.debug(`${JSON.stringify(options)}`);

  const web3 = new Web3(new Web3.providers.HttpProvider(`${INFURA_HTTPS}`, options));
  (await web3.eth.net.getPeerCount())
    ? logger.info(
        `Infura HTTP provider connected to ${await web3.eth.net.getPeerCount()} ` + `peers, ETH node:${web3.version}`,
        options,
      )
    : web3.setProvider(new Web3.providers.WebsocketProvider(`${INFURA_WS}`))
    ? logger.info(
        `Infura Web3 provider connected to ${await web3.eth.net.getPeerCount()} ` + `peers, ETH node:${web3.version}`,
        options,
      )
    : logger.error(`Infura API Key:${INFURA_API_KEY} appears to be invalid`);
  logger.debug(web3.currentProvider);
  return web3;
};

export const eth_infura_http = async (): Promise<void> => {
  const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_HTTPS));
};

export const eth_infura_ws = async (): Promise<void> => {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_WS));
  (web3.currentProvider as WebsocketProvider)?.disconnect(1000, 'Finished using the socket, bye.');
};

(async () => {
  await eth_infura_http_ws();
  await eth_infura_http();
})();
