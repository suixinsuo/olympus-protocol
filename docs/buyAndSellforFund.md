# Buy and Sell tokens in a Fund

### Introduction

The has more insight into the viability of projects thus he knows better in which tokens to invest and when to buy/sell​ tokens. Olympus Fund provides a really simple way, so the manager can easily operate many tokens at the same time

Initialize a fund already created with the new code.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const fundAddress = "0x....";
const fundAbi = [];
const fund = web3.eth.contract(fundAbi).at(fundAddress);
```

Note: To be able to perform this action, it interacts with OlympusExchangeProvider, An additional fee may apply in MOT. Always make sure that the Fund itself has MOT in it.

```javascript
const erc20ABI = [];
const motAddress = "0x263c618480dbe35c300d8d5ecda19bbb986acaed"; // Kovan 0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a
const mot = web3.eth.contract(erc20).at(fundAddress);
const amountMOT = 1;
const data = mot.approve.getData(fund.address, amountMOT);
web3.eth.sendTransaction({ data, to: mot.address }, callback (err, results) => {
  if (err) {
    return console.error(err);
  }
  console.log('Approval requested');
});
```

Sending MOT directly to the fund won't affect the price of the Fund.

### Interface

Functions that allow​ the fund manager to operate buy/sell of the tokens using OlympusExchangeProvider.

```javascript
     function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
```

There is also an extended function to retrieve the underlying tokens of the Fund.

```javascript
    function getTokens() external view returns(address[], uint[]);
```

GetTokens will return the list of tokens and the amount.

Note: `getTokens()` function has different behaviour in the index, while `getTokens()` provides the list of tokens and weights, and `getTokensWithAmounts()` provides
the tokens and amounts.

### Get Tokens

```javascript
    function getTokens() external view returns(address[], uint[]);
```

`getTokens()` helps to retrieve the underlying tokens and corresponding amounts which belong to a fund.

> You can also check the balance of a token, use ERC20(address).balanceOf(fund.address).

Note: When using getTokens, the result might be slightly different than the real balance of those tokens (due to airdrop or mistakenly sending, etc) in both
of the cases.

The Fund performs a recalculation automatically whenever a token is bought or sold to reflect the price change.

Note: When a token is completely sold, it's address will still be returned in the addresses array with the amount of 0.

##### Returns

First array with the addresses of the tokens of the fund,
Second array with the amount of the tokens of the fund.

#### Example code

Call `getTokens()` right after a successful buying/selling​ to get the latest status.

```javascript
fund.getTokens((err, results) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  const [tokensAddresses, tokensAmounts] = result;
  tokenAddresses.forEach((address, index) => {
    console.log(`${tokensAddresses}} => ${tokensAmounts[index]})`);
  });
});
```

### Buy Tokens

```javascript
   function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
```

This function is used for the fund manager to buy tokens with the ether in the fund. Refer to: `getETHBalance()`.

The list of tokens and the list of amounts must be of the same size, being the amounts the value of ETH that you want to spend in each
token.
Be aware that the total of amounts has to be less or the same that the balance available on the fund (provided by `getETHBalance()`).

##### Parameters

\​_exchangeId: Request OlympusExchangeProvider to use the specified exchange to trade, (Depending on the implementation, this might not be fulfilled). By default, the value should be 0x0 so the ExchangeProvider chooses it automatically.
In a normal scenario, set as `0x0` by default, allowing OlympusExchange to chose the best option for you.
\_tokens: List of token addresses that will be purchased.
\_amounts: The number of Ethers that will be used to buy tokens specified above. The unit is in Wei.
Note: The length of this array should be the same as the number of tokens. And the total of values of this array should equal `msg.value`.
Note: Be also aware that the total of amounts has to be less or the same that the balance available on the fund (provided by `getETHBalance()`).
\_rates: Rate of how many tokens you can buy with one ETH. Use `0` if you want to buy at any rate.
Note: The length of this array should be the same as the number of tokens.

#### Special scenarios

1.  The function reverts if there are untradable (determined by OlympusExchangeProvider) tokens in the token list.
2.  Additional fee might apply during the Exchange process. Make sure you have enough MOT in your fund.
3.  It reverts if the parameters are invalid, for instance: the lengths of the arrays differ or the specified ETH value doesn't exactly match msg.value.
4.  The function reverts if any of the transactions is considered​ risky by RiskControlProvider.
5.  The function reverts if the ExchangeProvider can't trade within the specified rate after a period of time.
6.  The function reverts if the caller is not permitted.

##### Returns

Boolean indicates whether the buying succeeds​.

#### Example code

Example of how get the rates of the tokens.

```javascript
const priceAddress = "0x0adasd...";
const priveAbi = [];
const priveProvider = web3.eth.contract(priceAbi).at(priveAddress);

// 1 ETH invested 0.5ETH in each token
const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
const tokenAddreses = ["0x263c6184...", "0x263c6184..."];
const rates = [];

// Get Rates for token 1.
const priveProvider.getPrice(ETH, tokenAddreses[0], amounts[0], "0x0" , (err, tokenRates) => {
  if (err) {
    return console.error(err);
  }
  // Token rates returns base rate and slippage rate. We shall use the second to insusure our
  // operation works.
  rates[0] = tokenRates[1].toNumber():
});
```

TokenAddresses, amounts and rates are calculated in the previus code.
Instead of rates calculated we could use `[0,0]` which will accept any rate available.

```javascript
const data = fund.buyTokens.getData("0x0", tokenAddresses, amounts, rates);

web3.eth.sendTransation({ data, to: fund.address }, (err, results) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  const [tokensAddresses, tokensAmounts] = result;
  tokenAddresses.forEach((address, index) => {
    console.log(`${tokensAddresses}} => ${tokensAmounts[index]})`);
  });
});
```

### Sell Tokens

```javascript
   function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
```

Sell the tokens the fund holds and retrieve ETH back. To know which tokens are available, check `getTokens()`.

##### Parameters

\​_exchangeId: Request OlympusExchangeProvider to use the specified exchange to trade, (Depending on the implementation, this might not be fulfilled). By default, the value should be 0x0 so the ExchangeProvider chooses it automatically.
In a normal scenario, set as `0x0` by default, allowing OlympusExchange to chose the best option for you.
\_tokens: List of token addresses that will be purchased.
\_amounts: : The number of Ethers that will be used to buy tokens specified above. The unit is in Wei.
Note: The length of this array should be the same as the number of tokens. And the values of this array should less or the same that the balance available on the fund (provided by `getTokens()`).
\_rates: Rate of how many tokens you can buy with one ETH. Use `0` if you want to buy at any rate.
Note: The length of this array should be the same as the number of tokens.

#### Special scenarios

1.  The function reverts if there are untradable (determined by OlympusExchangeProvider) tokens in the token list.
2.  Additional fee might apply during the Exchange process. Make sure you have enough MOT in your fund.
3.  It reverts if the parameters are invalid, for instance: the lengths of the arrays differ or the specified ETH value doesn't exactly match msg.value.
4.  The function reverts if any of the transactions is considered​ risky by RiskControlProvider.
5.  The function reverts if the ExchangeProvider can't trade within the specified rate after a period of time.
6.  The function reverts if the caller is not permitted.

##### Returns

Boolean indicates whether the buying succeeds​.

#### Example code

In the code below, sell the 1000 MOT in the fund.

```javascript
const tokenAddreses = ["0x263c6184...", "0x263c6184..."];
const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
const data = fund.buyTokens.getData("0x0", tokenAddresses, amounts, [0]);

web3.eth.sendTransation({ data, to: fund.address }, (err, results) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  const [tokensAddresses, tokensAmounts] = result;
  tokenAddresses.forEach((address, index) => {
    console.log(`${tokensAddresses}} => ${tokensAmounts[index]})`);
  });
});
```

### Price update.

There are 2 facts that might slightly affect the price of the Fund. For trade, the assets you get mostly is not exactly equal to what you have estimated; For some components, some little amounts of fee might also apply.
