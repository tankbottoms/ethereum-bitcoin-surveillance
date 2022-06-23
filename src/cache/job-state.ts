import { read_text_file as read_fs_config, write_object_to_file } from '../utils/fs';
import { Mongo } from '../mongodb';
import { CURRENT_JOB_STATE_CACHE_FILENAME } from '../config';
import { CONFIGURATIONS } from '../config/mongo';
import { logger } from '../utils';
import { Dynamic, JobState, JobStatus } from '../types';

export const job_state_sample: JobState = {
  job_id: '',
  status: JobStatus.RUNNING,
  error_blocks: [],
  current_block: null,
  end_block: null,
  timestamp: Date.now(),
};

export const get_db_job_state = async (options: Dynamic) => {
  let config = await Mongo.find_one(CONFIGURATIONS, { type: options.type });
  if (!config) {
    await Mongo.update_documents(CONFIGURATIONS, { type: options.type }, options);
    config = await Mongo.find_one(CONFIGURATIONS, { type: options.type });
  } else if (config instanceof Error) {
    logger.error(`error getting db job state`);
  } else {
    return config.job_state;
  }

  return null;
};

export const get_fs_job_state = async (job_state: Dynamic) => {
  let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
  config = config && JSON.parse(config);
  if (!config || config.status === JobStatus.COMPLETED) {
    await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, job_state);
    config = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    config = config && JSON.parse(config);
  }
  return config;
};

export const empty_error_blocks = async () => {
  try {
    let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    config = (await config) && JSON.parse(config);
    if (config) {
      const update_state = { ...config, status: JobStatus.RUNNING, error_blocks: [] };
      await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
      logger.info('successfully deleted the previous termination error block accumilation');
    }
  } catch (err) {
    return err;
  }
};

export const remove_current_blocks = async () => {
  try {
    let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    config = (await config) && JSON.parse(config);
    if (config) {
      const current_block = null;
      const update_state = { ...config, status: JobStatus.RUNNING, current_block };
      await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
      logger.info('successfully deleted last block_index which caused previous termination, system reset');
    }
  } catch (err) {
    return err;
  }
};

export const add_error_block = async (block: number) => {
  try {
    let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    config = (await config) && JSON.parse(config);
    if (config) {
      const { error_blocks } = config;
      const updated_error_blocks = [...error_blocks, block];
      const update_state = {
        ...config,
        status: JobStatus.RUNNING,
        error_blocks: updated_error_blocks,
        timestamp: Date.now(),
      };
      await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
      logger.info(`successfully added ${block} error block to state`);
    }
  } catch (err) {
    logger.info(`${err} occurred when adding an error block`);
    return err;
  }
};

export const update_current_block = async (current_block: number) => {
  try {
    let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    if (config) {
      config = JSON.parse(config);
      const update_state = {
        ...config,
        job_id: config.job_id,
        status: JobStatus.RUNNING,
        current_block,
        timestamp: Date.now(),
      };
      await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
      logger.debug(`updating state with current block:${current_block} to end_block:${config.end_block}`);
    }
  } catch (err) {
    const update_state = { status: JobStatus.RUNNING, current_block, error_blocks: [] };
    await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
    return err;
  }
};

export const completed_status = async () => {
  try {
    let status = JobStatus.COMPLETED;
    let config: any = await read_fs_config(CURRENT_JOB_STATE_CACHE_FILENAME);
    config = (await config) && JSON.parse(config);
    if (config) {
      if (config.status === JobStatus.ERROR) status = JobStatus.ERROR;
      const update_state = { ...config, status };
      await write_object_to_file(CURRENT_JOB_STATE_CACHE_FILENAME, update_state);
      logger.debug('job state completed');
    }
  } catch (err) {
    logger.error(err);
    return err;
  }
};
