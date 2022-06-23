# Messari
The following fragments were extracted from Python code currently used to fetch `Messari` data.

### Query fragments
```typescript
const market_pair = ['bibox', 'bitforex', 'coinone', 'hotbit', 'bithumb', 'bitmex', 'bitso', 'bit-z', 'btc38', 'uniswap', 'btcc', 'cexio', 'coinmate', 'ethfinex', 'exx', 'gatecoin' 'hitbtc', 'huobi', 'itbit', 'korbit', 'kucoin', 'lbank', 'localbitcoins', 'luno', 'mtgox', 'okcoin', 'okex', 'quoine', 'therocktrading', 'yobit', 'zaif', 'zb'];
const api_key_header = `{"x-messari-api-key": "bcc9eae7-e169-4fb7-9984-1aba92ac6e3e"}`;
const data_range = `["2021-05-05T00:00:15.000Z&end=2021-05-26"]`;
const url = "https://data.messari.io/api/v1/markets/"+market_pair[0]+"/metrics/price.usd/time-series?beg="+date_range[0]+"T00:00:00.000Z&interval=15m", headers=headers
```

### Additional query types
* `"https://data.messari.io/api/v1/markets/"+l0[i]+"/metrics/price.usd/time-series?beg="+str1_list[x]+"T00:00:00.000Z&interval=15m", headers=headers`

### Types
* 32, 41, market pairs
* circulating market capitalization
* market pairs
* supply market capitalization
