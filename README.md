augur.js
========

JavaScript bindings for the Augur API.

Installation
------------

augur.js requires you to be running a local Ethereum node.  By default, it expects your Ethereum client to be listening on port 8545.  Note that I've only tested with [geth](https://github.com/ethereum/go-ethereum) so far; use with [eth](https://github.com/ethereum/cpp-ethereum) or [pyethapp](https://github.com/ethereum/pyethapp) at your own risk.

To use "send" RPC commands, you will need to unlock your client.  The easiest way to do this is to start geth with the `--unlock` option:
```
geth --rpc --rpccorsdomain "http://localhost:8545" --shh --unlock primary
```
augur.js can be installed using npm:
```
npm install augur
```
After installing, to use it with Node, just require it:
```javascript
> var Augur = require('augur.js');
```

Usage
-----

### Augur API

augur.js is a set of (hopefully convenient, easy-to-use) JavaScript bindings for the Augur API.  The augur.js function name, as well as the order of parameters, are generally the same as those of the underlying [augur-core](https://github.com/AugurProject/augur-core) Serpent functions.  (A few function names have been changed to avoid ambiguity, e.g. `faucet`.)

All Augur functions have an optional callback (or callbacks; see below) as their final parameter.  augur.js currently implements the following Augur API functions:

- getCashBalance(address[, callback])
- getRepBalance(branch, address[, callback])
- getBranches([callback])
- getMarkets(branch[, callback])
- getMarketInfo(market[, callback])
- getMarketEvents(market[, callback])
- getNumEvents(market[, callback])
- getEventInfo(event[, callback])
- getBranchID(branch[, callback])
- getNonce(id[, callback])
- getCurrentParticipantNumber(market[, callback])
- getParticipantSharesPurchased(market, participantNumber, outcome[, callback])
- getSharesPurchased(market, outcome[, callback])
- getEvents(branch, votePeriod[, callback])
- getVotePeriod(branch[, callback])
- getPeriodLength(branch[, callback])
- getBranch(branchNumber[, callback])
- sendCash(receiver, value[, callback])
- cashFaucet([callback])
- reputationFaucet([callback])
- getDescription(id[, callback])
- createEvent(branch, description, expDate, minValue, maxValue, numOutcomes[, sentCallback, verifiedCallback])
- createMarket(branch, description, alpha, liquidity, tradingFee, events[, sentCallback, verifiedCallback, failedCallback])
- buyShares(branch, market, outcome, amount, nonce[, callback])
- sellShares(branch, market, outcome, amount, nonce[, callback])
- sendReputation(branch, receiver, value[, callback])

(Examples and more API functions coming soon!)

If you need more flexibility, please refer to the `invoke` function below, which allows you to build a transaction object manually, then broadcast it to the network with `sendTransaction` and/or capture its return value with `call`.

### Ethereum JSON-RPC commands

augur.js sends commands to Ethereum via [JSON-RPC](https://github.com/ethereum/wiki/wiki/JSON-RPC).  The lower-level RPCs are described here. 

#### Basic RPC commands

The `raw` method allows you to send in raw commands (similar to sending in via cURL):
```
> Augur.raw("net_peerCount")
"0x10"

> Augur.eth("gasPrice")
"0x015f90"
```
Many of the commonly used functions have named wrappers.  For example, `coinbase` fetches your coinbase account:
```javascript
> Augur.coinbase()
"0x63524e3fe4791aefce1e932bbfb3fdf375bfad89"
```

#### Uploading and downloading contracts

`publish` broadcasts (uploads) a compiled contract to the network, and returns the contract's address:
```javascript
> Augur.publish("0x603980600b6000396044567c01000000000000000000000000000000000000000000000000000000006000350463643ceff9811415603757600a60405260206040f35b505b6000f3")
"0xf4549459f9ef8c8898c054a7fc37c286831c2ced"
```
`read` downloads code from a contract already on the Ethereum network:
```javascript
> Augur.read("0x5204f18c652d1c31c6a5968cb65e011915285a50")
"0x7c010000000000000000000000000000000000000000000000000000000060003504636ffa1caa81141560415760043560405260026040510260605260206060f35b50"
```

#### Running contract functions

`invoke` executes a function in a contract already on the network:
```javascript
> tx = {
...   to: "0x5204f18c652d1c31c6a5968cb65e011915285a50",
...   function: "double",
...   signature: "i",
...   params: 22121,
...   send: false,
...   returns: "int"
... };

> Augur.invoke(tx)
44242
```
(`execute` and `run` are both aliases for `invoke`.) The function called here `double(22121)` simply doubles its input argument, so the result is as expected.  The transaction fields are as follows:
```
Required:
    - to: <contract address> (hexstring)
    - function: <function name> (string)
    - signature: <function signature, e.g. "iia"> (string)
    - params: <parameters passed to the function>
Optional:
    - send: <true to sendTransaction, false to call (default)>
    - from: <sender's address> (hexstring; defaults to the coinbase account)
    - returns: <"array", "int", "BigNumber", or "string" (default)>
```
The `params` and `signature` fields are required if your function accepts parameters; otherwise, these fields can be excluded.  The `returns` field is used only to format the output, and has no effect on the actual RPC command.

*`invoke` currently only works for Serpent contracts.*  I haven't (yet) included all the different datatypes that Solidity supports in augur.js's encoder -- all parameters are strings, int256, or int256 arrays.  If you need a more flexible ABI encoder, I recommend [pyepm](https://github.com/etherex/pyepm), specifically the `pyepm.api.abi_data` method.

#### Asynchronous RPC and callbacks

By default, augur.js is fully asynchronous, although by changing `rpc.async` to `true` it can be forced to make synchronous HTTP RPC requests.  This is generally not recommended, especially if augur.js is running in the browser, as synchronous RPC requests block the main JS thread (which essentially freezes the browser).  All of augur.js's methods that involve an HTTP RPC request take an optional callback function as their last parameter.

#### From the browser

augur.js can be used from the browser (although the Ethereum client must be set to accept RPC calls from the browser's address).  To use augur.js in the browser, just include `augur.min.js`, as well as the [bignumber.js](https://github.com/MikeMcl/bignumber.js) and [js-sha3](https://github.com/emn178/js-sha3) libraries.

Tests
-----

The tests included with augur.js are in `test/runtests.js`, and can be run using npm:
```
npm test
```
