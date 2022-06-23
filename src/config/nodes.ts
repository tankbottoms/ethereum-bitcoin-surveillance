/* eslint-disable no-void */
import { RPCClient } from 'rpc-bitcoin';
import { BTC_NODE_AWS_IP, BTC_NODE_AWS_PORT, BTC_NODE_AWS_USER, BTC_NODE_AWS_PASS, BTC_RPC_TIMEOUT } from '../config';
import { logger } from '../utils/logger';

export const test_btc_http_rpc = async (): Promise<any> => {
  const btc_rpc_option = {
    url: `http://${BTC_NODE_AWS_IP}`,
    port: parseInt(`${BTC_NODE_AWS_PORT}`),
    timeout: BTC_RPC_TIMEOUT,
    user: BTC_NODE_AWS_USER,
    pass: BTC_NODE_AWS_PASS,
  };

  const btc_rpc = new RPCClient(btc_rpc_option);
  const blockchain_info = await btc_rpc.getblockchaininfo();

  logger.info(JSON.stringify(btc_rpc_option));
  logger.info(JSON.stringify(blockchain_info));
};

export const test_btc_eth_http_rpc = async () => {
  await test_btc_http_rpc();
};
