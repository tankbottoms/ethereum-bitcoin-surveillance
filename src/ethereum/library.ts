/* TODO : this doesn't compile cleanly.

import { function_signatures } from '../smart_contracts/dictionary';
import { logger } from '../utils';

type FunctionSignatures = { fourbytes: string; text_signature: string[] | string };

const function_signature_hex_to_string = async (fourbytes: string): Promise<string> => {
  return await Buffer.from(fourbytes, 'hex').toString();
};

const function_signature_string_to_hex = async (signature: string): Promise<string> => {
  return await Buffer.from(signature).toString('hex');
};

const hex_to_base64 = async (hex_string: string): Promise<string | unknown> => {
  try {
    // eslint-disable-next-line no-param-reassign
    if (hex_string.startsWith('0x')) hex_string = hex_string.replace('0x', '');
    return await Buffer.from(hex_string, 'hex').toString('base64');
  } catch (error) {
    logger.info(`${error}`);
    return error;
  }
};

const function_signatures_by_keyword = (keyword: string) => {
  const fourbytes_function: FunctionSignatures[] = [];
  for (const [key, value] of Object.entries(function_signatures)) {
    // logger.info(`${key} ==> ${value}`);
    if (value[0].toLowerCase().includes(keyword)) {
      logger.info(`${key} ==> ${value[0]}`);
      fourbytes_function.push({ fourbytes: key, text_signature: value[0] });
    }
  }
  return fourbytes_function ? fourbytes_function : undefined;
};

async () => {
  const keyword = 'token';
  const token_signatures = function_signatures_by_keyword(keyword);
  token_signatures?.forEach(t => {
    const { fourbytes, text_signature } = t;
    logger.info(`${fourbytes} => ${text_signature}`);
  });
};

*/
