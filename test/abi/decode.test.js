"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decode_1 = require("../../src/abi/decode");
describe('reconcileStructFromDecodedTuple', () => {
    it('reconciles struct from tuple', () => {
        expect((0, decode_1.reconcileStructFromDecodedTuple)(['foo', 'bar', 123], {
            name: 'foo',
            type: 'tuple',
            components: [
                {
                    name: 'a',
                    type: 'string',
                },
                {
                    name: 'b',
                    type: 'string',
                },
                {
                    name: 'c',
                    type: 'uint256',
                },
            ],
        })).toMatchInlineSnapshot(`
            Object {
              "a": "foo",
              "b": "bar",
              "c": 123,
            }
        `);
    });
    it('reconciles array of struct from tuple array', () => {
        expect((0, decode_1.reconcileStructFromDecodedTuple)([
            ['foo', 'bar', 123],
            ['baz', 'bing', 456],
        ], {
            name: 'foo',
            type: 'tuple[]',
            components: [
                {
                    name: 'a',
                    type: 'string',
                },
                {
                    name: 'b',
                    type: 'string',
                },
                {
                    name: 'c',
                    type: 'uint256',
                },
            ],
        })).toMatchInlineSnapshot(`
            Array [
              Object {
                "a": "foo",
                "b": "bar",
                "c": 123,
              },
              Object {
                "a": "baz",
                "b": "bing",
                "c": 456,
              },
            ]
        `);
    });
});
