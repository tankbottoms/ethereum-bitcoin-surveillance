/* eslint-disable no-shadow */
import { Transaction } from 'web3-core';
import { logger } from '../utils';

export type PendingMempool = { block_height: number; transactions: string[] };

export const approx_bitcoin_blocks_per_day: number = 144;

export type Dynamic = { [k: string]: any };

export const validate_block_by_number = (fromBlock: number, toBlock: number) => {
  return toBlock === -1 || toBlock > fromBlock;
};

interface BlockHeader {
  number: number;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionRoot: string;
  stateRoot: string;
  receiptRoot: string;
  miner: string;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: number | string;
}

export interface Block extends BlockTransactionBase {
  transactions: Transaction[] | string[];
}

export interface BlockTransactionBase extends BlockHeader {
  size: number;
  difficulty: number;
  totalDifficulty: number;
  uncles: string[];
}

export interface BlockTransactionObject extends BlockTransactionBase {
  transactions: Transaction[];
}

export interface BlockTransactionString extends BlockTransactionBase {
  transactions: string[];
}

export type BlockRangeConfiguration = {
  block_range?: number[];
  start_block?: number;
  end_block?: number;
  size_block?: number;
  block_range_concurrency?: number;
  block_concurrency?: number;
  transaction_concurrency?: number;
  get_transactions?: boolean;
};

export type EthereumProcessingOptions = {
  extraction_type?: string;
  blockchain_data_type_flag?: number;
  block_range: number[];
  from_date?: string;
  to_date?: string;
  start_block: number;
  end_block: number;
  size_block: number;
  get_transactions?: boolean;
  block_range_concurrency?: number;
  block_concurrency?: number;
  transaction_concurrency?: number;
  concurrency?: number;
  min_time?: number;
  target?: string;
  verbosity?: boolean;
  job_id?: string;
  force?: boolean;
};

export type BitcoinProcessingOptions = EthereumProcessingOptions;
