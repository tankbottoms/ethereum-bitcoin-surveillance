"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signature_1 = require("../../src/abi/signature");
describe('parseSignature', () => {
    expect((0, signature_1.parseSignature)('Hello(uint256)', 'function')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "type": "uint256",
            },
          ],
          "name": "Hello",
          "type": "function",
        }
    `);
    expect((0, signature_1.parseSignature)('batchCancelOrders(address[5])', 'function')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "type": "address[5]",
            },
          ],
          "name": "batchCancelOrders",
          "type": "function",
        }
    `);
    expect((0, signature_1.parseSignature)('helloWorld()', 'function')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [],
          "name": "helloWorld",
          "type": "function",
        }
    `);
});
test('computeSignature', () => {
    expect((0, signature_1.computeSignatureHash)((0, signature_1.computeSignature)({
        inputs: [
            {
                indexed: true,
                name: 'owner',
                type: 'address',
            },
            {
                indexed: true,
                name: 'operator',
                type: 'address',
            },
            {
                indexed: false,
                name: 'approved',
                type: 'bool',
            },
        ],
        name: 'ApprovalForAll',
        type: 'event',
    }), 'event')).toMatchInlineSnapshot(`"17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"`);
    expect((0, signature_1.computeSignatureHash)((0, signature_1.computeSignature)({
        inputs: [
            {
                name: 'operator',
                type: 'address',
            },
            {
                name: '_approved',
                type: 'bool',
            },
        ],
        name: 'setApprovalForAll',
        type: 'function',
    }), 'function')).toMatchInlineSnapshot(`"a22cb465"`);
});
