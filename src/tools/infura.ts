import { getClient } from '@ethercast/eth-jsonrpc-client';
import { INFURA_API_KEYS } from '../config';
import { random } from '../utils';

const infura_get_block_by_number = async (block_number: number): Promise<any> => {
  const validatedClient = getClient(
    `https://mainnet.infura.io/v3/${INFURA_API_KEYS[random(INFURA_API_KEYS.length)]}`,
    true,
  );
  const block = await (await validatedClient).eth_getBlockByNumber(block_number, false);
  return block;
};

const infura_get_block_by_hash = async (transaction_hash: string): Promise<any> => {
  const validatedClient = getClient(
    `https://mainnet.infura.io/v3/${INFURA_API_KEYS[random(INFURA_API_KEYS.length)]}`,
    true,
  );
  const block = await (await validatedClient).eth_getBlockByHash(transaction_hash, false);
  return block;
};

const change_num_to_hex = (num: number): string => {
  const hex_string = num.toString(16);
  const hex = `0x${hex_string}`;
  return hex;
};

await (async () => {
  const hash = '0x7429e12da298d5d20aa04a7366bad5dc4315b9b533e1f59e3837cfcb5126e9c3';
  false && (await infura_get_block_by_hash(hash));

  const hex = change_num_to_hex(7163868400889561);
  console.log(hex);
})();
