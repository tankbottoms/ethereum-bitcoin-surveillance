"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const path_1 = require("path");
const repo_1 = require("../../../src/abi/repo");
const blockwatcher_1 = require("../../../src/blockwatcher");
const state_1 = require("../../../src/state");
const client_1 = require("../../../src/eth/client");
const http_1 = require("../../../src/eth/http");
const recorder_1 = require("../../../src/eth/recorder");
const mock_1 = require("../../../src/platforms/mock");
const debug_2 = require("../../../src/utils/debug");
const lru_1 = require("../../../src/utils/lru");
const testoutput_1 = require("../../testoutput");
let logHandle;
beforeEach(() => {
    logHandle = (0, debug_2.suppressDebugLogging)();
});
afterEach(() => {
    logHandle.restore();
});
test('blockwatcher', async () => {
    const BLOCK = 8394957;
    (0, debug_2.enableTraceLogging)();
    debug_1.default.enable('ethlogger:abi:*');
    await (0, recorder_1.withRecorder)(new http_1.HttpTransport('https://dai.poa.network', {}), {
        name: `testcases-ethdenver-${BLOCK}`,
        storageDir: (0, path_1.join)(__dirname, '../../fixtures/recorded'),
        replay: true,
    }, async (transport) => {
        const ethClient = new client_1.BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
        const abiRepo = new repo_1.AbiRepository({
            decodeAnonymous: true,
            fingerprintContracts: true,
            abiFileExtension: '.json',
            directory: (0, path_1.join)(__dirname, '../../abis'),
            searchRecursive: true,
            requireContractMatch: true,
            reconcileStructShapeFromTuples: false,
        });
        await abiRepo.initialize();
        const checkpoints = new state_1.State({
            path: (0, path_1.join)(__dirname, '../../../tmp/tmpcheckpoint.json'),
            saveInterval: 10000,
        });
        const checkpoint = checkpoints.getCheckpoint('main');
        checkpoint.setInitialBlockNumber(0);
        const output = new testoutput_1.TestOutput();
        const contractInfoCache = new lru_1.LRUCache({ maxSize: 100 });
        const blockWatcher = new blockwatcher_1.BlockWatcher({
            abiRepo,
            checkpoint,
            config: {
                enabled: true,
                blocksMaxChunkSize: 1,
                pollInterval: 1,
                maxParallelChunks: 1,
                startAt: 'latest',
                decryptPrivateTransactions: false,
                retryWaitTime: 10,
            },
            ethClient,
            output,
            contractInfoCache,
            waitAfterFailure: 1,
            nodePlatform: mock_1.MOCK_NODE_ADAPTER,
        });
        await blockWatcher.processChunk({ from: BLOCK, to: BLOCK });
        expect(output.messages).toMatchSnapshot();
    });
}, 15000);
