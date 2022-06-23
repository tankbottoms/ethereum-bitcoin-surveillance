import EtherscanClient from '@ethercast/etherscan-client';
import { UNISWAP_CONTRACT } from '../config/addresses';
import { ETHERSCAN_API_KEY } from '../config';

export const etherscan = async () => {
  const client = new EtherscanClient({ apiKey: ETHERSCAN_API_KEY, apiUrl: 'https://api.etherscan.io/api' });
  const abi = await client.getAbi(UNISWAP_CONTRACT);
  console.log(abi);
};
