Basic Index
===========

### Introduction

A cryptocurrency index is a vehicle that allows investors to mimic the investment returns of a basket of underlying tokens. The Olympus Basic Index contains the basic interfaces that an index needs. This document walks you through the functions of the basic index (created by the Olympus team) that are targeted at investors.

### Basic info

The code below shows how to get an index's basic information, including the index's name, symbol, description, category and decimals.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
(new Web3.providers.HttpProvider("http://localhost:8545"));
// address: deployed index contract address
const indexContract = web3.eth.contract(abi).at(address);
// Name
indexContract.name((err,name)=>{
if (err) {
  return console.error(err);
}
console.log(name);
})
// Symbol
indexContract.symbol((err,symbol)=>{
if (err) {
  return console.error(err);
}
console.log(symbol);
})
// Description
indexContract.description((err,description)=>{
if (err) {
  return console.error(err);
}
console.log(description);
})
// Category
indexContract.category((err,category)=>{
if (err) {
  return console.error(err);
}
console.log(category);
})
// Decimals
indexContract.decimals((err,decimals)=>{
if (err) {
  return console.error(err);
}
console.log(decimals);
})
```

### Interface

1. invest
---------

``` {.sourceCode .javascript}
function invest() public payable returns(bool);
```

#### Description

Invest in the index by calling the invest function while sending Ether to the index.

#### Returns

> Whether the function executed successfully or not.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const investAmount = 1 ** 17;
indexContract.invest({value: investAmount}, (err, result) => {
if (err) {
  return console.log(err)
}
});
```

2. getTokens
------------

``` {.sourceCode .javascript}
function getTokens() public view
  returns (address[] _tokens, uint[] _weights);
```

#### Description

Call the function to get all the tokens with their weights.

#### Returns

> Two Arrays {[Tokens],[Weights]} of the same length, where the token at the position 0 have the weight at the position 0.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getTokens((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

3. getTokensAndAmounts
----------------------

``` {.sourceCode .javascript}
function getTokensAndAmounts() external view returns(address[], uint[]);
```

#### Description

Call the function to get the underlying tokens with amounts.

#### Returns

> Two Arrays {[Tokens],[Amounts]} of the same length, where the token at the position 0 have the amount at the position 0.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getTokensAndAmounts((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

4. tokensWithAmount
-------------------

``` {.sourceCode .javascript}
function tokensWithAmount() public view returns( ERC20Extended[] memory);
```

#### Description

Call the function to get the actual active tokens with amounts, tokens that have been all sold will not be returned.

#### Returns

> Array of the actual active tokens with amounts.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.tokensWithAmount((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

5. getPrice
-----------

``` {.sourceCode .javascript}
function getPrice() public view returns(uint);
```

#### Description

Call the function to get the unit price of the index.

#### Returns

> The unit price of the index.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getPrice((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

6. getAssetsValue
-----------------

``` {.sourceCode .javascript}
function getAssetsValue() public view returns (uint);
```

#### Description

Call the function to get the total value calculated based on the value of the index's underlying assets.

#### Returns

> The total value calculated based on the value of the index's underlying assets.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getAssetsValue((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

7. getETHBalance
----------------

``` {.sourceCode .javascript}
function getETHBalance() public view returns(uint);
```

#### Description

Call the function to get the remaining ETH balance of the index.

#### Returns

> The remaining ETH balance of the index.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getETHBalance((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

8. withdraw
-----------

``` {.sourceCode .javascript}
function withdraw() external returns(bool);
```

#### Description

This function is for investors to withdraw all of their investment.

#### Returns

> Whether the function executed successfully or not.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.withdraw((err, result) => {
if (err) {
  return console.log(err)
}
});
```

### abi

> You can get the [abi](../api.html) from our API
