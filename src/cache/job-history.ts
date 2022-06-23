import { JOB_HISTORY_CACHE_FILENAME } from '../config';
import { Dynamic, JobHistory, JobStatus } from '../types';
import { read_text_file as read_fs_config, write_object_to_file } from '../utils/fs';

const job_history_sample: JobHistory = {
  job_id: '12357',
  status: 2,
  timestamp: Date.now(),
};

export const get_fs_job_history = async (job_history: Dynamic): Promise<any> => {
  let history: any = await read_fs_config(JOB_HISTORY_CACHE_FILENAME);
  history = history && JSON.parse(history);
  const resultIndex = history && history.findIndex((data: Dynamic) => data.job_id === job_history.job_id);
  if (!history) {
    const start_history = [];
    start_history.push(job_history);
    await write_object_to_file(JOB_HISTORY_CACHE_FILENAME, start_history);
    history = await read_fs_config(JOB_HISTORY_CACHE_FILENAME);
    history = history && JSON.parse(history);
  } else if (history.length > 0 && resultIndex === -1) {
    history.push(job_history);
    await write_object_to_file(JOB_HISTORY_CACHE_FILENAME, history);
  }
  return history[resultIndex];
};

export const update_fs_job_history = async (id: string) => {
  try {
    let history: any = await read_fs_config(JOB_HISTORY_CACHE_FILENAME);
    history = history && (await JSON.parse(history));
    if (history && history.length > 0) {
      const resultIndex = history.findIndex((data: Dynamic) => data.job_id === id);
      if (resultIndex === -1) return null;
      history[resultIndex].status = JobStatus.COMPLETED;
      history[resultIndex].timestamp = Date.now();
      await write_object_to_file(JOB_HISTORY_CACHE_FILENAME, history);
    }
    return history;
  } catch (err) {
    return err;
  }
};

async () => {
  false && (await get_fs_job_history(job_history_sample));
  true && (await update_fs_job_history('0x7bc087f4ef9d0dc15fef823bff9c78cc5cca8be0a85234afcfd807f412f40877'));
};
