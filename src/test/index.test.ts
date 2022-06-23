import { connect_mongodb } from './mongo.test';
import { btc_http_rpc, eth_http_rpc, eth_ws_rpc, btc_eth_aws_http_rpc } from './node.test';
import { eth_infura_http_ws, eth_infura_http, eth_infura_ws } from './ethereum-infura.test';
import { messari_io } from './messari.test';
import { etherscan } from './etherscan.test';
import { environment_keys } from './rotate.test';
// import { display_typeof_examples } from '../utils/type';
import { logger } from '../utils';

const introduction = async () => {
  const w_ext: boolean = true;
  const this_filename = w_ext ? __filename.slice(__dirname.length + 1) : __filename.slice(__dirname.length + 1, -3);

  logger.info(`starting ${this_filename}`);
};

export const run_all_test = async () => {
  false && (await introduction());
  false && (await connect_mongodb());
  false && (await environment_keys());
  false && (await btc_http_rpc());
  false && (await eth_http_rpc());
  false && (await eth_ws_rpc());
  false && (await btc_eth_aws_http_rpc());
  false && (await eth_infura_http_ws()) && (await eth_infura_http()) && (await eth_infura_ws());
  false && (await messari_io());
  false && (await etherscan());
  //   false && display_typeof_examples();
};
