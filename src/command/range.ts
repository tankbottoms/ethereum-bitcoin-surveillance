import moment from 'moment-timezone';
import { Web3Helper } from '../ethereum/web3';
import { is_date_same as is_same_date } from '../utils';

export { is_date_same, validate_date_range } from '../utils';

export const ethereum_block_height = async () => {
  return await Web3Helper.getHandle().eth.getBlockNumber();
};

export const is_valid_date_range = (from_date: Date, to_date: Date) => {
  if (is_same_date(from_date, to_date)) return false;
  return moment(to_date).isBefore(from_date);
};
