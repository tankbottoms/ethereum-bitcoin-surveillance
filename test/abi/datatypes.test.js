"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const datatypes_1 = require("../../src/abi/datatypes");
test('isValidAbiType', () => {
    expect((0, datatypes_1.isValidAbiType)('foo')).toBe(false);
    expect((0, datatypes_1.isValidAbiType)('uint256[]')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('uint256[1]')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('uint256[][1]')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('uint8')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('uint8[32][]')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('byte[0]')).toBe(false);
    expect((0, datatypes_1.isValidAbiType)('uint13')).toBe(false);
    expect((0, datatypes_1.isValidAbiType)('uint16')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('int10000')).toBe(false);
    expect((0, datatypes_1.isValidAbiType)('string')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('function')).toBe(false);
    expect((0, datatypes_1.isValidAbiType)('bytes')).toBe(true);
    expect((0, datatypes_1.isValidAbiType)('string[]')).toBe(true);
});
test('getDataSize', () => {
    expect((0, datatypes_1.getDataSize)('int32')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect((0, datatypes_1.getDataSize)('uint256[]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect((0, datatypes_1.getDataSize)('uint256[1]')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect((0, datatypes_1.getDataSize)('uint256[][1]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect((0, datatypes_1.getDataSize)('uint8[1][]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect((0, datatypes_1.getDataSize)('uint16')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect((0, datatypes_1.getDataSize)('string')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect((0, datatypes_1.getDataSize)('bytes')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(() => (0, datatypes_1.getDataSize)('foo')).toThrowErrorMatchingInlineSnapshot(`"Invalid name \`foo\`"`);
    expect(() => (0, datatypes_1.getDataSize)('uint13')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: uint13"`);
    expect(() => (0, datatypes_1.getDataSize)('int10000')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: int10000"`);
});
describe('encodeInputType', () => {
    it('encodes simple types', () => {
        expect((0, datatypes_1.encodeInputType)({ type: 'uint256', name: 'foo' })).toMatchInlineSnapshot(`"uint256"`);
    });
    it('encodes tuple types', () => {
        expect((0, datatypes_1.encodeInputType)({
            name: 'whatever',
            type: 'tuple',
            components: [
                { name: 'one', type: 'string' },
                { name: 'two', type: 'uint256' },
            ],
        })).toMatchInlineSnapshot(`"(string,uint256)"`);
    });
    it('encodes arrays of typles', () => {
        expect((0, datatypes_1.encodeInputType)({
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
                    type: 'string',
                },
                {
                    name: 'd',
                    type: 'string',
                },
                {
                    name: 'e',
                    type: 'string',
                },
                {
                    name: 'f',
                    type: 'string',
                },
                {
                    name: 'g',
                    type: 'string',
                },
                {
                    name: 'h',
                    type: 'uint256',
                },
                {
                    name: 'i',
                    type: 'string',
                },
                {
                    name: 'j',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            name: 'x',
                            type: 'string',
                        },
                        {
                            name: 'y',
                            type: 'string',
                        },
                        {
                            name: 'z',
                            type: 'string',
                        },
                    ],
                    name: 'k',
                    type: 'tuple',
                },
            ],
            indexed: false,
            name: 'details',
            type: 'tuple[]',
        })).toMatchInlineSnapshot(`"(string,string,string,string,string,string,string,uint256,string,uint256,(string,string,string))[]"`);
    });
});
