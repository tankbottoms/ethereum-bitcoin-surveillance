import { MongoClient, Collection } from 'mongodb';
import { BLOCKS_COLLECTION, DATABASE_NAME_ETH, MONGODB } from '../config/mongo';
import { BlockRangeConfiguration } from '../types';
import { logger } from '../utils';
import { write_object_to_file } from '../utils/fs';
import fs from 'fs';

const client = new MongoClient(MONGODB);
/*
 * trigger event handler Db
 */
export const check_ethereum_block_range = async (block_range: any) => {
  try {
    logger.debug(JSON.stringify(block_range), 'BLOCK RANGE');

    const start_block = block_range[0];
    const end_block = block_range[block_range.length - 1];

    // why do we just return when the params seem to be invalid here.
    if (!end_block) return; // shouldn't return when !start_block as start_block can legitimately be zero.
    if (end_block < start_block) return;
    // how did we exit this function successfully? perhaps only when start_block == 0 and we'd return.
    const expected_total_blocks = end_block - start_block + 1;
    const VERBOSE = true;
    await client.connect();
    logger.debug(`connected successfully to ${MONGODB}`);
    const db = client.db(DATABASE_NAME_ETH);
    logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
    const collection: Collection<Document> = db.collection(BLOCKS_COLLECTION);
    const q = { number: { $gte: start_block, $lte: end_block } };
    const total_blocks_count = await collection.countDocuments(q);
    // both branches here exit.
    if (total_blocks_count === expected_total_blocks) {
      logger.info(`Block range is completed db_count:${total_blocks_count} => expected_count:${expected_total_blocks}`);
      process.exit(0);
    } else {
      const msnum = collection.aggregate([
        {
          $group: {
            _id: null,
            nos: { $push: q },
          },
        },
        {
          $addFields: {
            missing: { $setDifference: [{ $range: block_range }, '$nos'] },
          },
        },
      ]);
      logger.info(`Block range is incompleted db_count:${total_blocks_count} => expected_count:${expected_total_blocks}
      find missing blocks missing block(s) => ${expected_total_blocks - total_blocks_count} ${JSON.stringify(msnum)}`);
      // add to error block
      process.exit(0);
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

const get_upload_mongo_by_range = async (block_range: BlockRangeConfiguration) => {
  try {
    if (!block_range.end_block || !block_range.start_block) return;
    if (block_range.end_block < block_range.start_block) return;
    const TEST_PATH = 'block-range.json';
    const VERBOSE = true;
    await client.connect();
    logger.debug(`connected successfully to ${MONGODB}`);
    const db = client.db(DATABASE_NAME_ETH);
    logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
    const collection = db.collection(BLOCKS_COLLECTION);
    const q = { number: { $gte: block_range?.start_block, $lte: block_range?.end_block } };
    const blocks = await collection.find().filter(q).toArray();
    const file = fs.createWriteStream(TEST_PATH);
    file.write(JSON.stringify(blocks));
    // await write_config_json(TEST_PATH, blocks);
    // console.log(blocks);
    await client.close();
    return blocks;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const find_missing_block = async (block_range: BlockRangeConfiguration) => {
  try {
    if (!block_range.end_block || !block_range.start_block) return;
    if (block_range.end_block < block_range.start_block) return;
    const VERBOSE = true;
    await client.connect();
    logger.debug(`connected successfully to ${MONGODB}`);
    const db = client.db(DATABASE_NAME_ETH);
    logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
    const collection: Collection<Document> = db.collection(BLOCKS_COLLECTION);
    const q = { $gte: block_range?.start_block, $lte: block_range?.end_block };

    const all_blocks: number[] = [];

    for (let i = block_range?.start_block; i < block_range?.end_block; i++) {
      all_blocks.push(i);
    }
    const missing_block = collection.aggregate([
      {
        $match: {
          number: q,
        },
      },
      {
        $group: {
          _id: null,
          block_numbers: { $push: '$number' },
        },
      },
      {
        $project: {
          missing_block: { $setDifference: [all_blocks, '$block_numbers'] },
        },
      },
    ]);
    return missing_block;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const verify_block_range = async (block_range: BlockRangeConfiguration) => {
  try {
    if (!block_range.end_block || !block_range.start_block) return; // why return when !block_range.start_block?
    if (block_range.end_block < block_range.start_block) return;
    const expected_total_blocks = block_range.end_block - block_range?.start_block + 1;
    await client.connect();
    logger.debug(`connected successfully to ${MONGODB}`);
    const db = client.db(DATABASE_NAME_ETH);
    logger.debug(`successfully created db ${DATABASE_NAME_ETH}`);
    const collection: Collection<Document> = db.collection(BLOCKS_COLLECTION);

    const q = { number: { $gte: block_range?.start_block, $lte: block_range?.end_block } };
    const count: any = await collection.countDocuments(q);
    const total_blocks_count: number = count;
    if (total_blocks_count !== expected_total_blocks) {
      const missing_blocks = await find_missing_block(block_range);
      return missing_blocks;
    } else {
      return null;
    }
  } catch (error) {
    return error;
  }
};

async () => {
  false && (await check_ethereum_block_range([1000000, 2000000]));
  true && (await get_upload_mongo_by_range({ start_block: 100, end_block: 105 }));
};
