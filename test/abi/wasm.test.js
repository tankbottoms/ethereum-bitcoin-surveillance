"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wasm_1 = require("../../src/abi/wasm");
test('parseSignature', () => {
    expect((0, wasm_1.parseFunctionSignature)('Hello(uint256)')).toMatchInlineSnapshot(`
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
    expect((0, wasm_1.parseFunctionSignature)('Hello(bytes[32],address,(uint,int16))')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "type": "bytes[32]",
            },
            Object {
              "type": "address",
            },
            Object {
              "components": Array [
                Object {
                  "type": "uint256",
                },
                Object {
                  "type": "int16",
                },
              ],
              "type": "tuple",
            },
          ],
          "name": "Hello",
          "type": "function",
        }
    `);
    expect((0, wasm_1.parseFunctionSignature)('Hello()')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [],
          "name": "Hello",
          "type": "function",
        }
    `);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: no open parenthesis found"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: no open parenthesis found"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(blah)')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid name \`blah\`"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(blah int)')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid name \`blah int\`"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(int blah)')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Integer parsing error: invalid digit found in string"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(int')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid argument list"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(int)(uint)')).toThrowErrorMatchingInlineSnapshot(`"Unbalanced parenthesis"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo(int)uint')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid argument list"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('foo bar (int)')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid function name: \\"foo bar \\""`);
    expect(() => (0, wasm_1.parseFunctionSignature)('()')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Empty function name"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('test(uint27)')).toThrowErrorMatchingInlineSnapshot(`"Unable to parse signature: Invalid type: uint27"`);
    expect(() => (0, wasm_1.parseFunctionSignature)('test(int,)')).toThrowErrorMatchingInlineSnapshot(`"Unexpected end of argument list"`);
});
test('isValidDataType', () => {
    expect((0, wasm_1.isValidDataType)('int')).toBe(true);
    expect((0, wasm_1.isValidDataType)('int64[100]')).toBe(true);
    expect((0, wasm_1.isValidDataType)('foo')).toBe(false);
    expect((0, wasm_1.isValidDataType)('int27')).toBe(false);
    expect((0, wasm_1.isValidDataType)('int27[]')).toBe(false);
    expect((0, wasm_1.isValidDataType)('int32[]')).toBe(true);
    expect((0, wasm_1.isValidDataType)('(int32,bool)')).toBe(true);
    expect((0, wasm_1.isValidDataType)('(int27,bool)')).toBe(false);
});
test('parseSignature panic', () => {
    expect((0, wasm_1.parseFunctionSignature)(`cancelDebtOffer((address,((uint256,address),(uint8,bytes32,bytes32)),(uint256,uint256,address,(uint8,bytes32,bytes32)),(uint256,uint256,address,(uint8,bytes32,bytes32)),(address,address,uint256,address,uint256,address,address,uint256,address,uint256,address,uint256,address,uint256,uint256,address,bytes32,uint256,uint256,(uint8,bytes32,bytes32),(uint8,bytes32,bytes32),(uint8,bytes32,bytes32))))`)).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "components": Array [
                Object {
                  "type": "address",
                },
                Object {
                  "components": Array [
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint256",
                        },
                        Object {
                          "type": "address",
                        },
                      ],
                      "type": "tuple",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                  ],
                  "type": "tuple",
                },
                Object {
                  "components": Array [
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                  ],
                  "type": "tuple",
                },
                Object {
                  "components": Array [
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                  ],
                  "type": "tuple",
                },
                Object {
                  "components": Array [
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "address",
                    },
                    Object {
                      "type": "bytes32",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "type": "uint256",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                    Object {
                      "components": Array [
                        Object {
                          "type": "uint8",
                        },
                        Object {
                          "type": "bytes32",
                        },
                        Object {
                          "type": "bytes32",
                        },
                      ],
                      "type": "tuple",
                    },
                  ],
                  "type": "tuple",
                },
              ],
              "type": "tuple",
            },
          ],
          "name": "cancelDebtOffer",
          "type": "function",
        }
    `);
});
test('getDataSize', () => {
    expect((0, wasm_1.getDataSize)('uint')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect((0, wasm_1.getDataSize)('int[]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect((0, wasm_1.getDataSize)('(address,address,bytes32)')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 96,
        }
    `);
});
test('sha3', () => {
    expect((0, wasm_1.sha3)('foo')).toMatchInlineSnapshot(`"0x41b1a0649752af1b28b3dc29a1556eee781e4a4c3a1f7f53f90fa834de098c4d"`);
    expect((0, wasm_1.sha3)('')).toMatchInlineSnapshot(`null`);
    expect((0, wasm_1.sha3)('0x12')).toMatchInlineSnapshot(`"0x5fa2358263196dbbf23d1ca7a509451f7a2f64c15837bfbb81298b1e3e24e4fa"`);
    expect((0, wasm_1.sha3)('0x123')).toMatchInlineSnapshot(`"0x4a4613b6024d34a6aac825a96e99f1480be5fc28f4cfe736fbaad0457f5ba1e5"`);
    expect((0, wasm_1.sha3)('0x123z')).toMatchInlineSnapshot(`"0xea7d953054ed3082a5213c6e79bc8f76c7cdfed74690fc45ce903e2c9401e3a9"`);
});
test('toChecksumAddress', () => {
    expect((0, wasm_1.toChecksumAddress)('0x398137383b3d25c92898c656696e41950e47316b')).toMatchInlineSnapshot(`"0x398137383B3D25C92898C656696e41950e47316B"`);
    expect(() => (0, wasm_1.toChecksumAddress)('')).toThrowErrorMatchingInlineSnapshot(`"Invalid address \\"\\" (expected \\"0x\\" prefix)"`);
    expect(() => (0, wasm_1.toChecksumAddress)('398137383b3d25c92898c656696e41950e47316b')).toThrowErrorMatchingInlineSnapshot(`"Invalid address \\"398137383b3d25c92898c656696e41950e47316b\\" (expected \\"0x\\" prefix)"`);
    expect(() => (0, wasm_1.toChecksumAddress)('foobar')).toThrowErrorMatchingInlineSnapshot(`"Invalid address \\"foobar\\" (expected \\"0x\\" prefix)"`);
    expect(() => (0, wasm_1.toChecksumAddress)('0xfoobar')).toThrowErrorMatchingInlineSnapshot(`"Invalid address \\"0xfoobar\\""`);
});
