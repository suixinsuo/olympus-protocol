# Basic Index

### Introduction
A cryptocurrency index is a vehicle that allows investors to mimic the investment returns of a basket of underlying tokens. The Olympus Basic Index contains the basic interfaces that an index needs. This document walks you through the functions of the basic index (created by the Olympus team) that are targeted at investors.

### Basic info
> The code below shows how to get an index's basic information, including the index's name, symbol, description, category and decimals.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address); // address: deployed index contract address
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

#### 1. invest

```javascript
function invest() public payable returns(bool);
```

#### &emsp;Description
> Invest in the index by calling the invest function while sending Ether to the index.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const investAmount = 1 ** 17;
indexContract.invest({value: investAmount}, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

#### 2. withdraw

```javascript
function withdraw() external returns(bool);
```

#### &emsp;Description
> This function is for investors to withdraw all of their investment.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.withdraw((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi
> You can get the [abi](http://www.olympus.io/olympusProtocols/index/abi) from our API

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/index/bytecode) from our API
