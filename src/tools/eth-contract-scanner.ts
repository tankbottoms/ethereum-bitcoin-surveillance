/* eslint-disable max-len */
import Web3 from 'web3';
import Bottleneck from 'bottleneck';
import { EthereumNode } from '../ethereum/node';
import { ETH_NODE_AWS_IP, ETH_NODE_AWS_HTTP_PORT, ETH_NODE_AWS_WS_PORT, INFURA_WS, INFURA_HTTPS } from '../config';

import { logger, noooo, zeroPad } from '../utils';
import { assert } from 'console';

const socket = false;

const web3: Web3 = socket
  ? new Web3(new Web3.providers.WebsocketProvider(INFURA_WS))
  : new Web3(new Web3.providers.HttpProvider(INFURA_HTTPS));

const web3_aws: Web3 = socket
  ? new Web3(new Web3.providers.WebsocketProvider(`wss://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_WS_PORT}`))
  : new Web3(new Web3.providers.HttpProvider(`http://${ETH_NODE_AWS_IP}:${ETH_NODE_AWS_HTTP_PORT}`));

const active: Web3 = web3_aws ? web3_aws : web3;

const getTime = () => {
  return Date.now();
};

const getElapsed = (now: number) => {
  return (Date.now() - now) / 1000;
};

const getRange = (start: number, size: number): number[] => {
  return [...Array(size).keys()].map(i => start + i);
};

const getBlock = async (blockNo: number) => {
  return await web3?.eth.getBlock(blockNo);
};

const getTransaction = async (txHash: string) => {
  return await web3.eth.getTransaction(txHash);
};

const updateTimestamp = (timestamp: number) => {
  const block_timestamp = timestamp;
  const d = new Date(0);
  let final_timestamp;
  d.setUTCSeconds(block_timestamp);
  d.getMonth() > 10
    ? (final_timestamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`)
    : (final_timestamp = `${d.getFullYear()}-0${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`);
  return final_timestamp;
};

const processBlocks = async (block_range: number[], max_concurrent?: number, min_time?: number): Promise<any> => {
  const max = max_concurrent || 15;
  const min = min_time || 250;
  const transaction_throttle = new Bottleneck({ maxConcurrent: max, minTime: min });
  const block_start = block_range[0];
  const block_end = block_range[block_range.length - 1];
  for (let block_index = block_start; block_index <= block_end; block_index++) {
    const start = getTime();
    const block = await getBlock(block_index);
    const elasped = getElapsed(start);
    console.log(`(chrono) getBlock:${elasped} seconds`);
    const { transactions } = block;
    const timestamp = updateTimestamp(Number(block.timestamp));
    console.log(
      `original timestamp (unix UTC seconds):${block.timestamp}, updated timestamp human readable:${timestamp}`,
    );
    console.log(block);
    transactions.forEach(async tx => {
      await transaction_throttle.schedule(async () => {
        const start_tx = getTime();
        const transaction_data = await getTransaction(tx);
        const elasped_tx = getElapsed(start_tx);
        const { blockNumber, transactionIndex, input, from, to, value, gas, gasPrice } = transaction_data;
        assert(block_index === blockNumber);
        to === null
          ? console.log(
              `(${block_index}) (${transactionIndex})from:${from}input:(${input}),⛽${gas}/${gasPrice} (${elasped_tx}secs)💸: ${value} (wei)`,
            )
          : console.log(
              `(${block_index}) (${transactionIndex}) from:${from} => to:${to}, ⛽ ${gas}/${gasPrice} (${elasped} secs) 💸: ${value} (wei)`,
            );
      });
    });
  }
};

const processBlockTransactions = async (
  block_range: number[],
  max_concurrent?: number,
  min_time?: number,
): Promise<any> => {
  const max = max_concurrent ?? 15;
  const min = min_time ?? 250;
  const bottleneck = new Bottleneck({ maxConcurrent: max, minTime: min });
  block_range.forEach(async block_index => {
    await bottleneck.schedule(async () => {
      const start = getTime();
      const block = await web3?.eth.getBlock(block_index, true);
      const elasped = getElapsed(start);
      assert(block_index === block.number);
      // @ts-ignore
      const { transactions, hash, gasLimit, gasUsed, logsBloom, size, parentHash } = block;
      const timestamp = updateTimestamp(Number(block.timestamp));
      console.log(
        `${parentHash} hash:${hash}, ts:${block.timestamp}/${timestamp} ${gasUsed}/${gasLimit}, tx:${transactions.length} (${elasped} secs)`,
      );
      transactions.forEach(async transaction => {
        const { blockNumber, transactionIndex, input, from, to, value, gas, gasPrice } = transaction;
        assert(block_index === blockNumber);
        to === null
          ? console.log(
              `(${block_index}) (${transactionIndex}) from:${from} input:(${input}), ⛽ ${gas}/${gasPrice} (${elasped} secs) 💸: ${value} (wei)`,
            )
          : console.log(
              `(${block_index}) (${transactionIndex}) from:${from} => to:${to}, ⛽ ${gas}/${gasPrice} (${elasped} secs) 💸: ${value} (wei)`,
            );
      });
    });
  });
};

const scanContracts = async (block_range: number[], max_concurrent?: number, min_time?: number): Promise<any> => {
  const max = max_concurrent ?? 10;
  const min = min_time ?? 500;
  const transaction_throttle = new Bottleneck({ maxConcurrent: max, minTime: min });
  block_range.forEach(async block_index => {
    try {
      await transaction_throttle
        .schedule(() => active?.eth.getBlock(block_index, true))
        .then(block => {
          assert(block_index === block.number);
          // @ts-ignore
          const { transactions, hash, gasLimit, gasUsed, logsBloom, size, parentHash } = block;
          process.stdout.write(
            `(${zeroPad(block_index, 3)}) hash:${hash}, ts:${block.timestamp}, ⛽ ${gasUsed}, tx:${
              transactions.length
            }` + `\n`,
          );
          transactions.forEach(async transaction => {
            try {
              // @ts-ignore
              const { blockNumber, transactionIndex, from, to, value } = transaction;
              assert(block_index === blockNumber);
              to === null
                ? process.stdout.write(`\t` + `(${transactionIndex}) ${from}  💸: ${value} (wei)` + `\n`)
                : process.stdout.write(`\t` + `(${transactionIndex}) ${from} => ${to} 💸: ${value} (wei)` + `\n`);
            } catch (e) {
              await noooo();
              console.error(e);
            }
          });
        });
    } catch (e) {
      await noooo();
      console.error(e);
    }
  });
};

await (async () => {
  const active_provider: Web3 = web3_aws ? web3_aws : web3;
  logger.debug(active_provider.currentProvider);

  const from_start = true;

  if (from_start) {
    const start_block: number = 0;
    const size: number = 1000; // await web3.eth.getBlockNumber() - 1;
    false &&
      console.log(`(${size}) ${start_block} => ${size}, scan blocks and transcations starting from the beginning`);

    const workers = [] as Promise<void>[];
    const concurrency = 10;
    const minTime = 500;

    for (let block_index = start_block; block_index < size; ) {
      false &&
        process.stdout.write(
          `index:${block_index}, ` + `chunk_size:${block_index + concurrency}, ` + `size:${size}` + `\n`,
        );
      const block_range = getRange(block_index, concurrency);
      workers.push(scanContracts(block_range, concurrency, minTime));
      await Promise.all(workers);
      block_index += concurrency;
    }
  }

  EthereumNode.disconnectWeb3();
})();
