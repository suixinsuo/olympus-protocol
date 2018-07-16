# Buy and Sell tokens in a Fund

### Introduction

In the fund, the fund owner will use the ether of the investors to buy different tokens spreading the risk. He can decide which ones to shall be bought
and which ones need to be sold. The Olympus Fund proposes a really simple interface to allow the investor to buy and sell different tokens in
a single transaction.

Initialize a fund already created with the new code.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const fundAddress = "0x....";
const fundAbi = [];
const fund = web3.eth.contract(fundAbi).at(fundAddress);
```

Buy and Sell tokens uses our Exchange Provider which may have a small fee in MOT. Make sure the contract is holding MOT enough to pay this fee.

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

Sending MOT directly the fund will won't affect the price.

### Interface

That's the basic functions of the interfaces, that allow to buy and sell.

```javascript
     function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
```

From the basic interface we extend:

```javascript
    function getTokens() external view returns(address[], uint[]);
```

GetTokens will return the list of tokens and the amount.

WARNING! `getTokens()` function has different behaviour in the index, while `getTokens()` provides the list of tokens and heights, and `getTokensWithAmounts()` provides
the tokens and amounts.

### Get Tokens

```javascript
    function getTokens() external view returns(address[], uint[]);
```

Get tokens is a helper to get tokens and the amounts of the fund. This function is a short cat, we can always get the list of tokens and check
the balance of the fund using `ERC20` function `balanceOf(fund.address)`.

Once a token has been bought or sold, the fund will automatically update his internal state and the result of this function.

WARNING! When a token is completely sold, still will be returned in the addresses array with the amount of 0.

##### Returns

First array with the addresses of the tokens of the fund,
Second array with the amount of the tokens of the fund.

#### Example code

We can call `getTokens()` after a successful buy or sell operation refreshing the client side.

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

We can buy tokens using this function. The tokens are bought with the balance of the fund, which you can query using `getETHBalance()` function.
You can specify the exchange Id of the provider, but in most scenarios leaving at `0x0` allowing our component to choose the best provider for you.
The list of tokens and the list of amounts must be of the same size, being the amounts the value of ETH that you want to spend in each
token. Be aware that the total of amounts has to be less or the same that the balance available on the fund (provided by `getETHBalance()`).

##### Params

​_exchangeId: We can specify the exchange ID available in the OlympusExchange component that we want to use if we want to stick to a concrete exchange.
In a normal scenario, set as `0x0` by default, allowing OlympusExchange to chose the best option for you.
\_tokens: List of token addresses that want to be purchased.
\_amounts: The amounts in ETH that you want to invest in the purchase of each token.
\_rates: Rate of how many tokens you can buy with one ETH. Use `0` if you want to buy at any rate.

#### Special scenarios

1.  If any of your tokens is not exchangeable by price provider, will revert.
2.  If you don't have enough MOT in the fund for paying the fee will revert.
3.  If the amounts array is different size of tokens array, or the amounts total is higher than the ETH available balance of the fund, it will surely revert.
4.  If any of the transactions are considered risky by our risk provider, then it will also revert.
5.  If the exchange provider cannot match a rate equal to or better than the one requested, will revert.
6.  Only the owner can call this functions, otherwise, will revert.

##### Returns

True if successful.

#### Example code

We are investing 1 ETH, 50% in each token. (Knowing that our fund holds 1 ETH in his available balance).
First, we set the tokens and amounts, we can select a rate with `0` value, or find the current one
from the price provider component.

```javascript
const priceAddress = "0x0adasd...";
const priveAbi = [];
const priveProvider = web3.eth.contract(priceAbi).at(priveAddress);

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

```javascript
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

### Sell Tokens

```javascript
   function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
```

We can sell tokens using this function. The tokens are sold based in the amounts that the fund has (not the owner of the fund). You can query them
using the previous function `getTokens()`.
You can specify the exchange Id of the provider, but in most scenarios leaving at `0x0` allowing our component to choose the best provider for you.
The list of tokens and the list of amounts must be of the same size, being the amounts the value on tokens unit (take into account
different tokens can have different decimals).
Be aware that the total of amounts has to be less or the same that the balance available on the fund (provided by `getTokens()`).

##### Params

\​_exchangeId: We can specify the exchange ID available in the OlympusExchange component that we want to use if we want to stick to a concrete exchange.
In a normal scenario, set as `0x0` by default, allowing OlympusExchange to chose the best option for you.
\_tokens: List of token addresses that want to be purchased.
\_amounts: The amounts in the token unit that you want to sell.
\_rates: Rate of how many tokens you can buy with one ETH. Use `0` if you want to buy at any rate.

#### Special scenarios

1.  If any of your tokens is not exchangeable by price provider, will revert.
2.  If you don't have enough MOT in the fund for paying the fee will revert.
3.  If the amounts array is different size of tokens address, or the amounts total is higher than the ETH available balance of the fund.
4.  If any of the transactions are considered risky by our risk provider, then it will revert.
5.  If the exchange provider cannot match a rate equal to or better than the one requested, will revert.
6.  Only the owner can call this functions, otherwise, will revert.

##### Returns

True if successful.

#### Example code

We are selling 1000 MOT, that we have purchased before in the token.

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

In a real situation, buy or sell tokens is convert your ETH in assets values or the opposite, that shouldn't change the price of the fund. In a realistic situation,
the slippage rate, the small fees, etc, will affect to the value bought or sold slightly, so you can expect a slightly reduce of the price of your find.
