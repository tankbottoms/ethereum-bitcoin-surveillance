export const choices = ['help', 'set', 'get'];

export const settings = {
  alias: 'a',
  describe: 'Specify which setting to configure.',
  choices: choices,
  type: 'string' as const,
  demandOption: true,
  default: 'all',
};

export const mongodb = {
  alias: 'd',
  describe: 'Specifiy MongoDb address to use.',
  choices: ['127.0.0.1', '127.0.0.1'],
  default: '127.0.0.1',
};

export const mongodb_port = {
  alias: 'p',
  describe: `Specify the MongoDb port to use.`,
  type: 'number' as const,
  default: 27017,
};
