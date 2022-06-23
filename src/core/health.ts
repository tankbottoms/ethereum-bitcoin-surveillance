/* eslint-disable eqeqeq */
import { ManagedResource } from '../utils/resource';
import { pathExists, writeFile, unlink, readFile } from 'fs-extra';
import { createModuleDebug } from '../utils/debug';
import { AbortHandle, ABORT } from '../utils/abort';
import { sleep } from '../utils/async';

const { debug, info, warn, error } = createModuleDebug('health');

export const HEALTH_STATE_FILENAME = '.eth-etl-state.json';

export const HEALTH_STATE_UPDATE_INTERVAL = 5000;

export interface HealthState {
  healthy: boolean;
}

export interface PersistedHealthState extends HealthState {
  ts: number;
  pid: number;
}

export async function readHealthState(): Promise<PersistedHealthState> {
  //debug('Reading health state file %s', HEALTH_STATE_FILENAME);
  const contents = await readFile(HEALTH_STATE_FILENAME, { encoding: 'utf-8' });
  const state: PersistedHealthState = JSON.parse(contents);
  //debug('Received persisted health state: %O', state);
  return state;
}

/** HealthState stores a state file with health in the working directory of an eth-etl process */
export class HealthStateMonitor implements ManagedResource {
  private abort = new AbortHandle();
  private runPromise: Promise<void> | null = null;

  public start() {
    this.runPromise = this.run().catch(e => {
      error('Health state monitor terminated expectetly', e);
    });
  }

  public async run() {
    if (await pathExists(HEALTH_STATE_FILENAME)) {
      warn('Health state file %s already exists', HEALTH_STATE_FILENAME);
      const oldState = await readHealthState();
      error(
        'Removing stale health state file from pid %d which was updated %d ms ago',
        oldState.pid,
        Date.now() - oldState.ts,
      );
    }
    while (!this.abort.aborted) {
      try {
        await this.abort.race(this.updateHealthState(await this.determineHealthState()));
        await this.abort.race(sleep(HEALTH_STATE_UPDATE_INTERVAL));

        const prevState = await this.abort.race(readHealthState());
        if (prevState.pid !== process.pid) {
          error(
            'Unexpected PID %d in health state file. ' +
              'Possibly multiple eth-etl processes writing the same state file',
            prevState.pid,
          );
        }
      } catch (e) {
        if (e === ABORT) {
          break;
        }
        error('Caught error while updating health state', e);
      }
    }
    info('Heath state monitor stopped');
  }

  public async determineHealthState(): Promise<HealthState> {
    // TODO Add some logic to determine health state based on different components in the future
    return { healthy: true };
  }

  public async updateHealthState({ healthy }: HealthState) {
    const state: PersistedHealthState = {
      ts: Date.now(),
      pid: process.pid,
      healthy,
    };
    debug('Updating health state: %o', state);
    const data = JSON.stringify(state);
    await writeFile(HEALTH_STATE_FILENAME, data, { encoding: 'utf-8' });
  }

  public async removeHealthState() {
    try {
      // Just in case we have an active writeFile still going
      await sleep(10);
      debug('Deleting health state file %s', HEALTH_STATE_FILENAME);
      await unlink(HEALTH_STATE_FILENAME);
    } catch (e) {
      error('Failed to remove health state file', e);
    }
  }

  public async shutdown() {
    debug('Shutting down health state monitor');
    this.abort.abort();
    if (this.runPromise != null) {
      await this.runPromise;
      this.runPromise = null;
    }
    await this.removeHealthState();
    debug('Health state monitor shutodown complete');
  }
}

export function isProcessRunning(pid: number): boolean {
  debug('Checking if pid %d is alive', pid);
  try {
    const res: boolean = process.kill(pid, 0) as any;
    return !!res;
  } catch (e) {
    // TODO : test this, not sure what to do here since original does not compile.
    if (e instanceof Error) {
      return e.message === 'EPERM';
    }
    // return e.code === 'EPERM';
    return false;
  }
}

export async function checkHealthState(): Promise<boolean> {
  if (!(await pathExists(HEALTH_STATE_FILENAME))) {
    info('Health state file does not exist - assuming eth-etl process is not running');
    return false;
  }

  try {
    const state = await readHealthState();
    if (state.pid == null) {
      error('State file did not contain PID');
      await unlink(HEALTH_STATE_FILENAME).catch((e: any) => {
        error('Failed to clean up state file', e);
      });
      return false;
    }
    if (!isProcessRunning(state.pid)) {
      error('eth-etl process with PID %d does not appear to be running', state.pid);
      await unlink(HEALTH_STATE_FILENAME).catch((e: any) => {
        error('Failed to clean up state file', e);
      });
      return false;
    }
    info('eth-etl process with pid %d appears to be running', state.pid);

    if (state.ts == null || Date.now() - state.ts > 10_000) {
      error('eth-etl state file has not been updated in 10s. Assuming stale process.');
      return false;
    }
    info('eth-etl process has updated the state %d ms ago', Date.now() - state.ts);

    if (state.healthy !== true) {
      info('eth-etl process reported unheathly state');
      return false;
    }
    info('eth-etl process reported healthy state');
    return true;
  } catch (e) {
    error('Error while reading health state file', e);
    return false;
  }
}
