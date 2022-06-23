"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decode_1 = require("../../src/abi/decode");
const files_1 = require("../../src/abi/files");
test('getInputSize for all anonymous signatures', async () => {
    const sigs = await (0, files_1.loadSignatureFile)('data/fns.abisigs.gz');
    for (const abis of sigs.entries.map(i => i[1])) {
        for (const abi of abis) {
            expect(() => (0, decode_1.getInputSize)(abi)).not.toThrow();
        }
    }
});
