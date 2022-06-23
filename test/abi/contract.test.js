"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const contract_1 = require("../../src/abi/contract");
const repo_1 = require("../../src/abi/repo");
const fs_extra_1 = require("fs-extra");
test('extractFunctionsAndEvents', async () => {
    const config = {
        decodeAnonymous: false,
        fingerprintContracts: true,
        abiFileExtension: '.json',
        requireContractMatch: true,
        reconcileStructShapeFromTuples: false,
    };
    const abis = new repo_1.AbiRepository(config);
    await abis.loadAbiFile((0, path_1.join)(__dirname, '../abis/BCB.json'), config);
    const fne = (0, contract_1.extractFunctionsAndEvents)(await (0, fs_extra_1.readFile)((0, path_1.join)(__dirname, '../fixtures/contract1.txt'), { encoding: 'utf-8' }), (sig) => abis.getMatchingSignature(sig));
    expect(fne).toMatchInlineSnapshot(`
        Object {
          "events": Array [
            "Approval(address,address,uint256)",
            "OwnershipTransferred(address,address)",
            "Transfer(address,address,uint256)",
            "TransferWithData(address,address,uint256,bytes)",
          ],
          "functions": Array [
            "allowance(address,address)",
            "approve(address,uint256)",
            "balanceOf(address)",
            "burn(address,uint256)",
            "decimals()",
            "decreaseAllowance(address,uint256)",
            "increaseAllowance(address,uint256)",
            "isOwner()",
            "mint(address,uint256)",
            "name()",
            "owner()",
            "renounceOwnership()",
            "symbol()",
            "totalSupply()",
            "transfer(address,uint256)",
            "transferFrom(address,address,uint256)",
            "transferOwnership(address)",
            "transferWithData(address,uint256,bytes)",
          ],
        }
    `);
    expect((0, contract_1.computeContractFingerprint)(fne)).toMatchInlineSnapshot(`"30f0d1068a77a3aaa446f680f4aa961c9e981bff9aba4a0962230867d0f3ddf9"`);
});
