/* eslint-disable @typescript-eslint/no-floating-promises */
import * as dotenv from 'dotenv';
import { BLANK, logger } from '../utils';

dotenv.config();

export const environment_keys = async () => {
  const random = (max: number) => {
    return Math.floor(Math.random() * max);
  };
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');

  const INFURA_API_KEYS: string[] = [];
  const key_count: number = 11;

  for (let i = 0; i < key_count; i++) {
    const env_key = process.env[String(`INFURA_API_KEY_` + zeroPad(i, 3))] || BLANK;
    env_key.length ? INFURA_API_KEYS.push(env_key) : null;
  }

  const INFURA_API_KEY: string =
    INFURA_API_KEYS.length >= 1 ? INFURA_API_KEYS[random(INFURA_API_KEYS.length)] : '6b4cbecb2c8f4d369b78ebd576c58270';

  const INFURA_HTTPS: string = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
  const INFURA_WS: string = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;

  const ETHERSCAN_API_KEYS: string[] = [];

  for (let i = 0; i < key_count; i++) {
    const env_key = process.env[String(`ETHERSCAN_API_KEY_` + zeroPad(i, 3))] || BLANK;
    env_key.length ? ETHERSCAN_API_KEYS.push(env_key) : null;
  }

  const ETHERSCAN_API_KEY: string =
    ETHERSCAN_API_KEYS.length >= 1
      ? ETHERSCAN_API_KEYS[random(ETHERSCAN_API_KEYS.length)]
      : 'YM88X39NFYCHJG583153DY37VSR3I4CFA5';

  INFURA_API_KEYS.forEach(k => {
    logger.info(`INFURA_API_KEY: ${k}`);
  });

  logger.info(`INFURA_HTTPS:${INFURA_HTTPS}`);
  logger.info(`INFURA_WS:${INFURA_WS}`);

  ETHERSCAN_API_KEYS.forEach(k => {
    logger.info(`ETHERSCAN_API_KEY: ${k}`);
  });

  logger.info(`ETHERSCAN API KEY:${ETHERSCAN_API_KEY}`);
};

// (async () => { await environment_keys(); })();
