#!/usr/bin/env bash

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"web3_clientVersion",
	"params":[],
	"id":1
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"web3_sha3",
	"params":["0x68656c6c6f20776f726c64"],
	"id":64
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"eth_syncing",
	"params":[],
	"id":1
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"eth_blockNumber",
	"params":[],
	"id":83
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"eth_getBalance",
	"params":[
		"0x407d73d8a49eeb85d32cf465507dd71d507100c1",
		"latest"
	],
	"id":1
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"eth_getTransactionCount",
	"params":[
		"0x407d73d8a49eeb85d32cf465507dd71d507100c1",
		"latest"
	],
	"id":1
}'

curl --location --request POST '52.21.97.126:8545/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"jsonrpc":"2.0",
	"method":"eth_getBlockTransactionCountByNumber",
	"params":[
		"0x52A8CA"
	],
	"id":1
}'


