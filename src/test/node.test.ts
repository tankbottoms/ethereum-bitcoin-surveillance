/* eslint-disable no-void */
import { RPCClient } from 'rpc-bitcoin';
import Web3 from 'web3';
import { WebsocketProvider, provider } from 'web3-core';
import {
  BTC_NODE_AWS_IP,
  BTC_NODE_AWS_PORT,
  BTC_NODE_AWS_USER,
  BTC_NODE_AWS_PASS,
  BTC_RPC_TIMEOUT,
  ETH_NODE_AWS_IP,
  ETH_NODE_AWS_WS_PORT,
  ETH_NODE_AWS_HTTP_PORT,
} from '../config';
import { logger } from '../utils/logger';

export const btc_http_rpc = async (): Promise<any> => {
  const btc_node_options = {
    //    url: `http://${BTC_NODE_AWS_IP}`,
    url: `http://67.171.23.171`,
    port: parseInt(`${BTC_NODE_AWS_PORT}`),
    timeout: BTC_RPC_TIMEOUT,
    user: BTC_NODE_AWS_USER,
    pass: BTC_NODE_AWS_PASS,
  };

  const btc_rpc = new RPCClient(btc_node_options);
  const blockchain_info = await btc_rpc.getblockchaininfo();
  logger.info(JSON.stringify(btc_node_options));
  logger.info(JSON.stringify(blockchain_info));
};

const aws_eth_archive = `http://3.210.181.231:8545/`;
const aws_eth_node = `http://52.21.97.126:8545/`;
export const eth_http_rpc = async () => {
  const http_credentials = `${aws_eth_archive}`; // `http://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_HTTP_PORT}/`;
  logger.info(http_credentials);
  const web3 = new Web3(new Web3.providers.HttpProvider(http_credentials));
  const start_block = await web3?.eth.getBlockNumber();
  const clear_subscription = web3?.eth.clearSubscriptions((err, result) => {
    if (err) console.log(err);
    console.log(result);
  });
  logger.info(`block at height:${JSON.stringify(start_block)}`);
  logger.info(JSON.stringify(await web3.eth.getBlock('latest', true)));
};

export const eth_ws_rpc = async () => {
  const ws_credentials = `ws://3.210.181.231:8545`; // `ws://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_WS_PORT}`;
  logger.info(ws_credentials);
  const web3 = new Web3(new Web3.providers.WebsocketProvider(ws_credentials));
  logger.info(JSON.stringify(await web3.eth.getBlock('latest', false)));
  (web3.currentProvider as WebsocketProvider)?.disconnect(1000, 'Finished using the socket, bye.');
};

export const eth_test_archive_mode = async (node_uri?: string) => {
  /*
  curl --data '{"method":"eth_getBalance","params":["0xe5Fb31A5CaEE6a96de393bdBF89FBe65fe125Bb3", "0x1"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
  */
  const default_uri: string = `http://3.210.181.231:8545`;
  const eth_node = node_uri === undefined ? default_uri : node_uri;
  const http_credentials = `${eth_node}`; // `http://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_HTTP_PORT}/`;
  logger.info(`testing archive node:${http_credentials}`);
  const web3 = new Web3(new Web3.providers.HttpProvider(http_credentials));
  try {
    const archive_node_balance = await web3?.eth.getBalance('0xe5Fb31A5CaEE6a96de393bdBF89FBe65fe125Bb3');
    logger.info(`${JSON.stringify(archive_node_balance)}`);
  } catch (e) {
    logger.error(`rpc called had an error:${e}`);
  }
};

export const btc_eth_aws_http_rpc = async () => {
  true && (await btc_http_rpc());
  false && (await eth_http_rpc());
  false &&
    (await setTimeout(async () => {
      await eth_ws_rpc();
    }, 5000));
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
async () => {
  // await btc_eth_aws_http_rpc();

  await setTimeout(async () => {
    await eth_test_archive_mode(`http://67.171.23.171:8545/`);
  }, 3000);
};
