# Fund

### Introduction
A cryptocurrency fund is a vehicle that allows an investment manager to pool together ETH from investors for the purpose of investing while having the investors retain control of their ETH. The Olympus Fund contains the interfaces that a fund needs. This document walks you through the basic functions of the customized fund (created by the Olympus team) which should be used by investors.

### Basic info
> The code below shows how to get fund's basic information, including fund's name, symbol, description, category and decimals.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address); // address: deployed fund contract address
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

#### 1. invest

```javascript
function invest() public payable
     whenNotPaused
     whitelisted(WhitelistKeys.Investment)
     withoutRisk(msg.sender, address(this), ETH, msg.value, 1)
     returns(bool);
```

#### &emsp;Description
> Invest in the fund by calling the invest function while sending Ether to the fund. If the whitelist is enabled, it will check if the investor's address is in the investment whitelist. Furthermore, the parameters will also be sent to the risk provider for assessment.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const investAmount = 1 ** 17;
fundContract.invest({value: investAmount}, (err, result) => {
  if (err) {
    return console.log(err);
  }
});
```

#### 2. requestWithdraw

```javascript
function requestWithdraw(uint amount) external
      whenNotPaused
      withoutRisk(msg.sender, address(this), address(this), amount, getPrice());
```

#### &emsp;Description
> Investor can use this function to request withdraw certain amount of his investment.(Note: The investment will be withdrawn after the fund's manager or bot system executes the withdraw function.)

#### &emsp;Parameters
> amount: Amount of fund tokens the investor would like to withdraw.

#### &emsp;Returns
> No return

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const amount = 10 ** 17;
fundContract.requestWithdraw(amount, (err, result) => {
  if (err) {
    return console.log(err);
  }
});
```

### abi
> You can get the [abi](http://www.olympus.io/olympusProtocols/fund/abi) from our API

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/fund/bytecode) from our API
