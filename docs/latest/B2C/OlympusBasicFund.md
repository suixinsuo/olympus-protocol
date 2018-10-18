Basic Fund
==========

[TOC]

### Introduction

A cryptocurrency fund is a vehicle that allows an investment manager to pool together ETH from investors for the purpose of investing while having the investors retain control of their ETH. The Olympus Basic Fund contains the basic interfaces that a fund needs. This document walks you through the functions of the basic fund (created by the Olympus team) that are targeted at investors.

### Basic info

The code below shows how to get fund's basic information, including fund's name, symbol, description, category and decimals.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
// Name
fundContract.name((err,name)=>{
if (err) {
  return console.error(err);
}
console.log(name);
})
// Symbol
fundContract.symbol((err,symbol)=>{
if (err) {
  return console.error(err);
}
console.log(symbol);
})
// Description
fundContract.description((err,description)=>{
if (err) {
  return console.error(err);
}
console.log(description);
})
// Category
fundContract.category((err,category)=>{
if (err) {
  return console.error(err);
}
console.log(category);
})
// Decimals
fundContract.decimals((err,decimals)=>{
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
function invest() public
      payable
    returns(bool)
```

#### Description

Invest in the fund by calling the invest function while sending Ether to the fund.

#### Returns

> Whether the function executed successfully or not.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const investAmount = 1 ** 17;
fundContract.invest({value: investAmount}, (err, result) => {
if (err) {
  return console.log(err)
}
});
```

2. getTokens
------------

``` {.sourceCode .javascript}
function getTokens() external view returns(address[], uint[]);
```

#### Description

Call the function to get the underlying tokens with their amounts.

### Returns

Two Arrays {[Tokens],[Amounts]} of the same length, where the token at the position 0 have the amount at the position 0.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.getTokens((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

3. tokensWithAmount
-------------------

``` {.sourceCode .javascript}
function tokensWithAmount() public view
    returns( ERC20Extended[] memory);
```

#### Description

Call the function to get the actual active tokens with amounts.

#### Returns

> Array the actual active tokens with amounts.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.tokensWithAmount((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

4. getPrice
-----------

``` {.sourceCode .javascript}
function getPrice() public view returns(uint);
```

#### Description

Call the function to get the unit price of the fund.

#### Returns

> The unit price of the fund.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.getPrice((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

5. getAssetsValue
-----------------

``` {.sourceCode .javascript}
function getAssetsValue() public view returns (uint);
```

#### Description

Call the function to get the total value calculated based on the value of the fund's underlying assets.

#### Returns

> The total value calculated based on the value of the fund's underlying assets.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.getAssetsValue((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

6. getETHBalance
----------------

``` {.sourceCode .javascript}
function getETHBalance() public view returns(uint);
```

#### Description

Call the function to get the remaining ETH balance of the fund.

#### Returns

> The remaining ETH balance of the fund.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.getETHBalance((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

7. withdraw
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
const fundContract = web3.eth.contract(abi).at(address);

fundContract.withdraw((err, result) => {
if (err) {
  return console.log(err)
}
});
```

### abi

> You can get the [abi](../api.html) from our API
