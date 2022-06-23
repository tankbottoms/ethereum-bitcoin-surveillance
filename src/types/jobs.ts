/* eslint-disable no-shadow */
// eslint-disable-next-line no-shadow
export enum JobStatus {
  STARTING,
  COMPLETED,
  ERROR,
  RUNNING,
}

export type JobState = {
  job_id: string;
  status: JobStatus;
  current_block?: number | null;
  error_blocks?: number[];
  block_range?: number[];
  start_block?: number;
  end_block?: number | null;
  size_block?: number;
  block_range_concurrency?: number;
  block_concurrency?: number;
  timestamp?: Date | number;
};

export type JobHistory = {
  job_id: string;
  status: JobStatus;
  timestamp?: Date | number;
};

export enum JobType {
  ethereum = 'ethereum',
  bitcoin = 'bitcoin',
}

export enum ScheduleType {
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
}
