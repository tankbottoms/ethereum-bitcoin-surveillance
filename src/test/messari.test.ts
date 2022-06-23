import { getAssetBySymbol } from '../messari';
import { logger } from '../utils';

// eslint-disable-next-line max-len
const mkt = [
  'bibox',
  'bitforex',
  'coinone',
  'hotbit',
  'bithumb',
  'bitmex',
  'bitso',
  'bit-z',
  'btc38',
  'uniswap',
  'btcc',
  'cexio',
  'coinmate',
  'ethfinex',
  'exx',
  'gatecoin',
  'hitbtc',
  'huobi',
  'itbit',
  'korbit',
  'kucoin',
  'lbank',
  'localbitcoins',
  'luno',
  'mtgox',
  'okcoin',
  'okex',
  'quoine',
  'therocktrading',
  'yobit',
  'zaif',
  'zb',
];

export const messari_io = async () => {
  const asset = await getAssetBySymbol('BTC');
  logger.info(asset);
};
