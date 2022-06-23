### 

ethereum-bitcoin surveillance extracts blockchain data via the protocol Node RPC interaction, in addition to blocks, and transactions, a contract function signatures are extracted used to form a dictionary. this dictionary can then make be used to profile types of contracts on the ethereum blockchain. other types of extracted data includes mempool and exchange data. 


## outdated commands used in system crons

#### Blockchains
#### Market
#### Smart Contracts
#### Address Balances

### Build

### Docker

### Example Commands

The Ethereum Block and Transaction extraction system accepts either blocks or date range. The following examples are common usages.

```bash
# using only the start_block, the end block will be the block_height
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --start_block 1
ts-node ./src/index.ts bitcoin --extraction_type blocks_transactions --start_block 1
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --size_block=10 --force=true --x=true

# using both specified start_block and end_block for a range
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --start_block 12900000 --end_block 13000000
ts-node ./src/index.ts bitcoin --extraction_type blocks_transactions --start_block 10000 --end_block 13000

# using just the specified start_block and a size_block will have the same effect as the previous example
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --start_block 12900000 --size_block=1000000
ts-node ./src/index.ts bitcoin --extraction_type blocks_transactions --start_block 12900000 --size_block=1000000

# finally, knowing which block range explicitly is pretty unrealistic and unusable - so use the date range
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --from_date 07/01/2021 --to_date 07/25/2021
ts-node ./src/index.ts bitcoin --extraction_type blocks_transactions --from_date 07/01/2021 --to_date 07/25/2021
```

Common scenario is to fetch all existing blocks to date. As above, specify the start block, the system will run until it completes the entire fetch.

```bash
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --start_block 1
ts-node ./src/index.ts bitcoin --extraction_type blocks_transactions --start_block 1
```

After the initial fetch, it is common to run a schedule to fetch block ranges by date, for example every day at midnight, every week on sunday, and every month. The following examples follow the usual crontab conventions.

```bash
# to perform the function every month the following maybe used run at 1st day of the month
ts-node ./src/index.ts scheduler --schedule_type=monthly --job_type=ethereum
ts-node ./src/index.ts scheduler --schedule_type=monthly --job_type=bitcoin
 ts-node ./src/index.ts scheduler --node_cron"=* 1 * * *" --job_type=bitcoin

# to perform the function every week the following maybe used run at sunday
ts-node ./src/index.ts scheduler --schedule_type=weekly --job_type=ethereum  
ts-node ./src/index.ts scheduler --schedule_type=weekly --job_type=bitcoin  

# to perform the function every day the following argument to --schedule may be run at 23:00
ts-node ./src/index.ts scheduler --schedule_type=daily --job_type=ethereum 
ts-node ./src/index.ts scheduler --schedule_type=daily --job_type=bitcoin 
```

By setting the schedule, the system will create a cache schedule file which will be used by the system to load any previously configured schedules in the event of a system termination. Therefore, in order to view existing schedules the following maybe used:

```bash
# to print all cached schedules
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --schedule print

# to clear all cached schedules
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --schedule clear # or -1
```

The printout of the schedules will include its index so that a single entry maybe removed using:

```bash
ts-node ./src/index.ts ethereum --extraction_type blocks_transactions --schedule 1
```

### Commands

Application commands at all levels accept `--help`. `bitcoin` or `ethereum` denote which node to interact with.

The following commands are available.

```bash
index.ts [command]

Commands:
  index.ts test             Perform system tests.
  index.ts config           Override .env configurations.
  index.ts bitcoin          Extract data from a BTC Node via RPC commands.
  index.ts ethereum         Extract data from an ETH Node via RPC commands.
  index.ts smart_contracts  Perform operations on ETH smart contracts.
  index.ts scheduler        Schedule application tasks.

Options:
  --help     Show help                                                                                                                            [boolean]
  --version  Show version number                                                                                                                  [boolean]
```

The following arguments are for the `bitcoin` command.

```bash
index.ts bitcoin

Extract data from a BTC Node via RPC commands.

Options:
      --help                                    Show help                                                                                         [boolean]
      --version                                 Show version number                                                                               [boolean]
      --extraction_type, --type            Blockchain data to export.
                                              [string] [required] [choices: "blocks_transactions", "mempool", "addresses"] [default: "blocks_transactions"]
      --start_block, --start                    The block number to extract from.                                                    [number] [default: -1]
      --end_block, --end                        The block number to extract until.                                                   [number] [default: -1]
      --size_block, --size                      The number of consecutative blocks from start_block.                                 [number] [default: -1]
  -f, --from_date                               The starting date of the range of data to fetch. Defaults to current date - 1 month.
                                                                                                    [string] [default: "Tue Jul 13 2021 00:00:00 GMT-0700"]
  -t, --to_date                                 The starting date of the range of data to fetch. Defaults to the current date.
                                                                                                    [string] [default: "Fri Aug 13 2021 00:00:00 GMT-0700"]
      --target, --db                            Location of the extracted data.                         [choices: "database", "file"] [default: "database"]
      --block_range_concurrency, --block_range  Number of block chunks to run in parallel.                                           [number] [default: 10]
      --block_concurrency, --block              Number of block to fetch in parallel.                                                [number] [default: 15]
      --min_time, --min                         How long to wait after launching a job before launching another one. Default 1 sec.[number] [default: 1000]
  -c, --concurrency                             Number of operations to run in parallel. Default 10.                                 [number] [default: 10]
  -v, --verbosity                               Level of information provided to console.                                         [boolean] [default: true]
```

The following commands are for the `ethereum` command.

```bash
index.ts ethereum

Extract data from an ETH Node via RPC commands.

Options:
      --help                                    Show help                                                                                         [boolean]
      --version                                 Show version number                                                                               [boolean]
      --extraction_type, --type            Blockchain data to export.
                                              [string] [required] [choices: "blocks_transactions", "mempool", "addresses"] [default: "blocks_transactions"]
      --start_block, --start                    The block number to extract from.                                                    [number] [default: -1]
      --end_block, --end                        The block number to extract until.                                                   [number] [default: -1]
      --size_block, --size                      The number of consecutative blocks from start_block.                                 [number] [default: -1]
  -f, --from_date                               The starting date of the range of data to fetch. Defaults to current date - 1 month.
                                                                                                    [string] [default: "Tue Jul 13 2021 00:00:00 GMT-0700"]
  -t, --to_date                                 The starting date of the range of data to fetch. Defaults to the current date.
                                                                                                    [string] [default: "Fri Aug 13 2021 00:00:00 GMT-0700"]
      --target, --db                            Location of the extracted data.                         [choices: "database", "file"] [default: "database"]
      --block_range_concurrency, --block_range  Number of block chunks to run in parallel.                                           [number] [default: 10]
      --block_concurrency, --block              Number of block to fetch in parallel.                                                [number] [default: 15]
      --transaction_concurrency, --transaction  Number of transactions to fetch run in parallel.                                     [number] [default: 10]
  -c, --concurrency                             Number of operations to run in parallel. Default 10.                                 [number] [default: 10]
      --min_time, --min                         How long to wait after launching a job before launching another one. Default 1 sec.[number] [default: 1000]
  -v, --verbosity                               Level of information provided to console.                                         [boolean] [default: true]

```

#### Environment

Auto-gen of local `.env` into a env-template file.

```typescript
yarn run env-gen
# or
ts-node ./src/utils/dotenv.gen.ts
```

#### Resources

Libraries copied from the following repos

- [promise date structures](https://github.com/sindresorhus/promise-fun)
- [p-queue](https://github.com/sindresorhus/p-queue)
- [smart contract hooks](https://github.com/Neufund/smart-contract-watch)

#### Messages
##### Pending Transactions
```json
{
    "time":1639059362.35,
    "event":{
        "type":"pending",
        "hash":"0x0175c2c9c9976d67627a423ec75b9a0f5f008a5a81f10f0b9ee49dd0a3458071",
        "from":"0x0004d2A2f9a823C1A585fDE6514A17FF695E0001",
        "to":"0xd061D61a4d941c39E5453435B6345Dc261C2fcE0",
        "gas":373600,
        "gasPrice":40001000000,
        "input":"0x6a6278420000000000000000000000007ca5b0a2910b33e9759dc7ddb0413949071d7575",
        "nonce":853,
        "value":0,
        "v":"0x25",
        "r":"0x2b004461530f111a1017af8e155fbf601f83ef5d0e2912c7d19b886b84db00b7",
        "s":"0x2c384d1e1d639869be33ff299defa3ea35b58633c7f79de7163f6a98aadc75f7"
    },
    "fields":{},
    "sourcetype":"ethereum:transaction:pending"
}
```
##### Blocks
```json
{
  "time": 1438270295,
  "event": {
    "timestamp": 1438270295,
    "number": 50,
    "hash": "0xf2940e16e514f3580a5be5ddcd3bc4ab454e5a0708076ea08b2ff377efd07966",
    "parentHash": "0x36152f77dab83242172be7de0ca3aac20f647236732b3497008993acb927a57a",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "miner": "0xbb7B8287f3F0a933474a79eAe42CBCa977791171",
    "stateRoot": "0x73e1188b303b417de1f05f224a11dcb59ed30e7c24dffbd537eab2ecd5eba8a6",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "difficulty": 17484424691,
    "gasLimit": 5000,
    "gasUsed": 0,
    "extraData": "0x476574682f4c5649562f76312e302e302f6c696e75782f676f312e342e32",
    "nonce": "0x64c49cdc023eea0d",
    "totalDifficulty": 881564504005,
    "size": 542,
    "uncles": [],
    "transactionCount": 0
  },
  "fields": {},
  "sourcetype": "ethereum:block"
}
```
##### Peers
```json
{
  "time": 1639063776.448,
  "event": {
    "enr": "enr:-Je4QP4nGuUaaZL1YbyYX7VtDvXfKmvj94T2j6vFPhDpYwrXM6qKgqshogHIADFFcixwzKPSc12fI1ItQku4KwIHMTEZg2V0aMfGhLcVB32AgmlkgnY0gmlwhJ1aspuJc2VjcDI1NmsxoQOBWwU6OL3WEVehdwkNrBoDQpjbizHBByBiotueSiI55YN0Y3CCdl-DdWRwgnZf",
    "enode": "enode://815b053a38bdd61157a177090dac1a034298db8b31c1072062a2db9e4a2239e5253c6332959f79c38bc157721e00595368fa82392325bb6db428c7e3b5d37897@157.90.178.155:30303",
    "id": "2106c03fde3c5f0f8a946e5c88b6888c784a7248420428b9c7a79ab21ac2d956",
    "name": "Geth/v1.10.9-unstable-ffae2043/linux-amd64/go1.15.6",
    "caps": [
      "eth/66"
    ],
    "network": {
      "localAddress": "192.168.86.32:53759",
      "remoteAddress": "157.90.178.155:30303",
      "inbound": false,
      "trusted": false,
      "static": false
    },
    "protocols": {
      "eth": {
        "version": 66,
        "difficulty": 3.6192469718901337e+22,
        "head": "0xafd6e681fa2f3ef240370d545b95da0e2b51ef7a548c6fce99180034f0b6d5b9"
      }
    }
  },
  "fields": {},
  "sourcetype": "ethereum:geth:peer"
}
```
##### Node Info
```json
{
    "time": 1639063867.929,
    "event": {
      "transport": "jsonprc+http://192.168.86.32:8545",
      "enode": "enode://b38d0e0a47d36d009a2f52176928bf4e2850071a9c894fb3c06bf78e26c44e46257d7ac381b5f046ebd761c9be58659d6200c1c49204d55bbadaeffb090f8711@192.168.0.42:30303",
      "networkId": 1,
      "network": "mainnet",
      "chainId": 1,
      "chain": "eth",
      "protocolVersion": null,
      "clientVersion": "Geth/v1.10.12-stable-6c4dc6c3/windows-amd64/go1.17.2",
      "platform": "geth",
      "gethInfo": {
        "id": "157ea9f15f0d33525c5662c4086b46f01e12c818da41b37d1eb444c8f4c7acce",
        "name": "Geth/v1.10.12-stable-6c4dc6c3/windows-amd64/go1.17.2",
        "enode": "enode://b38d0e0a47d36d009a2f52176928bf4e2850071a9c894fb3c06bf78e26c44e46257d7ac381b5f046ebd761c9be58659d6200c1c49204d55bbadaeffb090f8711@192.168.0.42:30303",
        "enr": "enr:-Ka4QA7BKVZeGs3V9f2mvzev8seHnC13Txzr52LzSVM2kdaoYsN5cUHRLx-C1OUqlXagxrvJ_Isz3OORCQA0VLThit6GAX1NMPWpg2V0aMrJhLcVB32D0ijIgmlkgnY0gmlwhMCoACqJc2VjcDI1NmsxoQOzjQ4KR9NtAJovUhdpKL9OKFAHGpyJT7PAa_eOJsRORoRzbmFwwIN0Y3CCdl-DdWRwgnZf",
        "ip": "192.168.0.42",
        "ports": {
          "discovery": 30303,
          "listener": 30303
        },
        "listenAddr": "[::]:30303",
        "protocols": {
          "eth": {
            "network": 1,
            "difficulty": 3.6192596971041638e+22,
            "genesis": "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
            "config": {
              "chainId": 1,
              "homesteadBlock": 1150000,
              "daoForkBlock": 1920000,
              "daoForkSupport": true,
              "eip150Block": 2463000,
              "eip150Hash": "0x2086799aeebeae135c246c65021c82b4e15a2c451340993aacfd2751886514f0",
              "eip155Block": 2675000,
              "eip158Block": 2675000,
              "byzantiumBlock": 4370000,
              "constantinopleBlock": 7280000,
              "petersburgBlock": 7280000,
              "istanbulBlock": 9069000,
              "muirGlacierBlock": 9200000,
              "berlinBlock": 12244000,
              "londonBlock": 12965000,
              "arrowGlacierBlock": 13773000,
              "ethash": {}
            },
            "head": "0x9a0e65804158024db6b0217053899ba8b03149a10caf651d428594e37ca8f826"
          },
          "snap": {}
        }
      }
    },
    "fields": {},
    "sourcetype": "ethereum:node:info"
}
```
##### Internal Metrics
```json
{
    "time": 1639063970.656,
    "fields": {
      "metric_name": "blockchainETL.internal.system.mem.rss",
      "_value": 768643072
    }
  }
```
##### General Metrics
```json
{
    "time": 1639069348.773,
    "fields": {
      "metric_name": "blockNumber",
      "_value": 13772250
    },
    "sourcetype": "ethereum:node:metrics"
  }
```
##### Geth Metrics
```json
{
    "time": 1639069400.919,
    "fields": {
      "metric_name": "geth.memStats.totalAlloc",
      "_value": 680716057752
    },
    "sourcetype": "ethereum:node:metrics"
  } 
```
##### Syncing Metrics
```json
{
    "time": 1639070903.409,
    "fields": {
      "metric_name": "syncing.currentBlock",
      "_value": "0xd22640"
    },
    "sourcetype": "ethereum:node:metrics"
  }
```
##### Block with Transactions
```json
{
    "difficulty": "0x153335a4ece",
    "extraData": "0x476574682f76312e302e312f6c696e75782f676f312e342e32",
    "gasLimit": "0x5361",
    "gasUsed": "0x5208",
    "hash": "0x5793f91c9fa8f824d8ed77fc1687dddcf334da81c68be65a782a36463b6f7998",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "miner": "0xe9a411144a689aa2137b0efe7b6273491e636d8c",
    "mixHash": "0x0e400227693c630a5a0b6dbd46caf240a557750fbb4f3daad8b5b48326d36297",
    "nonce": "0x5ab261ffb22071fe",
    "number": "0xb459",
    "parentHash": "0x040d1cae2f64a48916a4c21c7e404bb2a9077b0df21d3380874d53e8a9cbf946",
    "receiptsRoot": "0x3a77c2406f28436905e8a91f40ab703c479cd6883b097c93a9c22e181122fe4e",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "size": "0x28e",
    "stateRoot": "0x24a3c69df04ba13066824e3289ec11ba42551d9a86b190146843174277058aa5",
    "timestamp": "0x55c427d5",
    "totalDifficulty": "0x97c22c5ec52b0b",
    "transactions": [
      {
        "blockHash": "0x5793f91c9fa8f824d8ed77fc1687dddcf334da81c68be65a782a36463b6f7998",
        "blockNumber": "0xb459",
        "from": "0xbd08e0cddec097db7901ea819a3d1fd9de8951a2",
        "gas": "0x5208",
        "gasPrice": "0xd3d4d32816",
        "hash": "0x19f1df2c7ee6b464720ad28e903aeda1a5ad8780afc22f0b960827bd4fcf656d",
        "input": "0x",
        "nonce": "0x0",
        "to": "0x5c12a8e43faf884521c2454f39560e6c265a68c8",
        "transactionIndex": "0x0",
        "value": "0x1142b0090b6460000",
        "type": "0x0",
        "v": "0x1b",
        "r": "0x6bf8f2ac14eb21a072f51a3cc75ee8aec5125255f06702ce3d40d4386de825f3",
        "s": "0x12799e552161d4730177fecd66c2e286d39505a855017eb1f05fa9fd4075e3cc"
      }
    ],
    "transactionsRoot": "0x5e84a6f6b13b9b0bf9d34eb464bb77ec898471c80a7eb8bee796db70fbb67fd3",
    "uncles": []
  }
```
##### Transactions
```json
{
    "time": 1438918233,
    "event": {
      "hash": "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
      "from": "0xA1E4380A3B1f749673E270229993eE55F35663b4",
      "to": "0x5DF9B87991262F6BA471F09758CDE1c0FC1De734",
      "gas": 21000,
      "gasPrice": 50000000000000,
      "input": "0x",
      "nonce": 0,
      "value": 31337,
      "v": "0x1c",
      "r": "0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
      "s": "0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
      "blockHash": "0x4e3a3754410177e6937ef1f84bba68ea139e8d1a2258c5f85db9f1cd715a1bdd",
      "blockNumber": 46147,
      "transactionIndex": 0,
      "status": "failure",
      "contractAddress": null,
      "cumulativeGasUsed": 0,
      "gasUsed": 0,
      "fromInfo": {
        "isContract": false
      },
      "toInfo": {
        "isContract": false
      }
    },
    "fields": {},
    "sourcetype": "ethereum:transaction"
  }
```
##### Transaction Events
```json
{
    "time": 1588598533,
    "event": {
      "removed": false,
      "logIndex": 0,
      "blockNumber": 10000000,
      "blockHash": "0xaa20f7bde5be60603f11a45fc4923aab7552be775403fc00c2e6b805e6297dbe",
      "transactionHash": "0x1f17943d5dd7053959f1dc092dfad60a7caa084224212b1adbecaf3137efdfdd",
      "transactionIndex": 5,
      "address": "0xCeD4E93198734dDaFf8492d525Bd258D49eb388E",
      "data": "0x0000000000000000000000000000000000000000000000052769477a7d940000",
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000876eabf441b2ee5b5b0554fd502a8e0600950cfa",
        "0x000000000000000000000000566021352eb2f882538bf8d59e5d2ba741b9ec7a"
      ],
      "addressInfo": {
        "isContract": true
      },
      "event": {
        "name": "Transfer",
        "signature": "Transfer(address,address,uint256)",
        "params": [
          {
            "name": "from",
            "type": "address",
            "value": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa"
          },
          {
            "name": "to",
            "type": "address",
            "value": "0x566021352EB2f882538BF8D59E5d2BA741b9EC7A"
          },
          {
            "name": "value",
            "type": "uint256",
            "value": "95073600000000000000"
          }
        ],
        "args": {
          "from": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
          "to": "0x566021352EB2f882538BF8D59E5d2BA741b9EC7A",
          "value": "95073600000000000000"
        }
      }
    },
    "fields": {},
    "sourcetype": "ethereum:transaction:event"
  }
```