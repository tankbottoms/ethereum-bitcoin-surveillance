import { Arguments, InferredOptionTypes } from 'yargs';
import { connect_mongodb } from './mongo.test';
import { display_typeof_examples, logger } from '../utils';
import { btc_http_rpc, eth_http_rpc, eth_ws_rpc } from './node.test';
import { messari_io } from './messari.test';
import { etherscan } from './etherscan.test';
import { activity } from './arguments';
import { eth_infura_http, eth_infura_ws, eth_infura_http_ws } from './ethereum-infura.test';
import { environment_keys } from './rotate.test';

export const command = 'test';
export const describe = 'Perform system tests.';
export const builder = {
  activity,
};

const noop = () => {
  logger.info(`noop`);
};

export const handler = async (argv: Arguments<InferredOptionTypes<typeof builder>>) => {
  const argv_activity = argv.activity;
  logger.info(`User selected:${activity}`);
  switch (argv_activity) {
    case 'mongodb':
      await connect_mongodb();
      break;
    case 'btc_http_rpc':
      await btc_http_rpc();
      break;
    case 'eth_http_rpc':
      await eth_http_rpc();
      break;
    case 'eth_ws_rpc':
      await eth_ws_rpc();
      break;
    case 'eth_infura_http':
      await eth_infura_http();
      break;
    case 'eth_infura_ws':
      await eth_infura_ws();
      break;
    case 'eth_infura_http_ws':
      await eth_infura_http_ws();
      break;
    case 'messari_io':
      await messari_io();
      break;
    case 'etherscan':
      await noop();
      break;
    case 'env_keys':
      await environment_keys();
      break;
    case 'noop':
      await noop();
      break;
    case 'typeof':
      await display_typeof_examples();
      break;
    case 'all':
      await connect_mongodb();
      await environment_keys();
      await btc_http_rpc();
      await eth_http_rpc();
      // await eth_ws_rpc();
      await eth_infura_http();
      await eth_infura_ws();
      await eth_infura_http_ws();
      await messari_io();
      await etherscan();
      await display_typeof_examples();
      break;
    default:
      noop();
  }
};
