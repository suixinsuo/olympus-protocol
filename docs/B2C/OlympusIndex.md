# Index

### Introduction
An index is an indicator or measure of something, and in finance, it typically refers to a statistical measure of change in a securities market. In the case of financial markets, stock and bond market indexes consist of a hypothetical portfolio of securities representing a particular market or a segment of it. The document serves as guideline to add tokenized cryptocurrency financial products to broaden your application’s product offerings.

### Basic info
> The code below shows how to get index's basic information, including index's name, symbol, description, category and decimals.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address); // address: deployed index address
// Name
indexContract.name((err,name)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(name)
})
// Symbol
indexContract.symbol((err,symbol)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(symbol)
})
// Description
indexContract.description((err,description)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(description)
})
// Category
indexContract.category((err,category)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(category)
})
// Decimals
indexContract.decimals((err,decimals)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(decimals)
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
> Invest in the index by calling the invest function while sending Ether to the index fund. If the whitelist is enabled, it will check if the investor's address is in the investment whitelist. Furthermore, the parameters will also be sent to the risk provider for assessment.

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

#### 2. requestWithdraw

```javascript
function requestWithdraw(uint amount) external
      whenNotPaused
      withoutRisk(msg.sender, address(this), address(this), amount, getPrice());
```

#### &emsp;Description
> Investor can use this function to request withdraw certain amount of his investment.(Note: The investment will be withdraw after the index's manager execute the withdraw function.)

#### &emsp;Parameters
> amount: Amount of ETH the investor would like to withdraw.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const amount = 10 ** 17;
indexContract.requestWithdraw(amount, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi
> You can get the [abi](http://www.olympus.io/olympusProtocols/index/abi) from our API

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/index/bytecode) from our API
