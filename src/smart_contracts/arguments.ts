export const activity = {
  alias: 'a',
  describe: 'Specify which action to perform on ETH smart contracts.',
  choices: ['search', 'balances', 'watch', 'help'],
  type: 'string' as const,
  demandOption: true,
  default: 'search',
};
