export type BlockRange = { startBlock?: number; blockSize?: number };
export type BlockSegments = { start_block?: number; block_size?: number; block_range?: number[] };
export type BlockRangeTimestamp = {
  start_date?: string;
  end_date?: string;
  start_block?: number;
  end_block?: number;
  block_size?: number;
};

export type IBlockRange = { start_block: number; end_block: number };
