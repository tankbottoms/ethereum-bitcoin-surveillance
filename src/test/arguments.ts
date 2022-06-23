export const activity_choices = [
  'all',
  'mongodb',
  'env_keys',
  'btc_http_rpc',
  'eth_http_rpc',
  'eth_ws_rpc',
  'messari_io',
  'etherscan',
  'eth_infura_http',
  'eth_infura_ws',
  'eth_infura_http_ws',
  'btc_mempool',
  'btc_blocks_transactions',
  'typeof',
  'help',
];

export const activity = {
  alias: 'a',
  describe: 'Specify which action to perform.',
  choices: activity_choices,
  type: 'string' as const,
  demandOption: true,
  default: 'all',
};
