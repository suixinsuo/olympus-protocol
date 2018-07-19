# Fund

### Introduction
TODO: Definition of a Fund

### Constructor
```javascript
constructor(
    string _name,
    string _symbol,
    string _description,
    string _category,
    uint _decimals
    ) public;
```
#### &emsp;Parameters
> _name: Fund name</br>
  _symbol: Fund symbol (The derivative is ERC20 compatible, so it follow the rules of ERC20. For example: the symbol length can be any, but it's better to keep in from 2 - 5)</br>
  _description: Fund description</br>
  _category: Fund category</br>
  _decimals: Fund decimals (normally it should be 18)</br>

#### &emsp;Example code
```javascript

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Fund";
const category = "YH";
const decimals = 18;

// get gas price
const gasPrice 
web3.eth.getGasPrice((err, price)=>{
  if (err) {
    return console.error(err);
  }
  gasPrice = price;
})

// get gas limit
const gasLimit;
const data = web3.eth.contract(abi).new.getData({
    name,
    symbol,
    description,
    category,
    decimals,
    {
      data: new Buffer(bytecode, 'utf8'),
    }
})
web3.eth.estimateGas(data,(err,gas)=>{
  if (err) {
   return console.error(err);
  }
  gasLimit = gas;
})

// deploy and get fund address
web3.eth.contract(abi).new(
      name,
      symbol,
      description,
      category,
      decimals,
      {
        from: web3.eth.accounts[0],
        data: new Buffer(bytecode, 'utf8'),
        gas: gasLimit,
        gasPrice: gasPrice,
      },
      (err: Error, newFund: any) => {
        if (err) {
          return console.error(err);
        }
        if (newFund && newFund.address) {
          // now the fund is deployed, do whatever you need to do.
          console.log(newFund.address)
        }
      }));
```
### Interface
#### 1. initialize 

```javascript
function initialize(address _componentList, uint _initialFundFee) onlyOwner external payable;
```
#### &emsp;Description
> Initialize the Fund then you can find it from olympus marketplace and you can invest it. (Note: The derivative has to hold some MOT as the possible fee for calling components. So is required to transfer some MOT to your Fund)

#### &emsp;Parameters
> _componentList: address of olympus componentlist </br>
  _initialFundFee: management fee of fund
  value: the initial balance of the fund

#### &emsp;Example code

> The code below shows how to call this function with Web3.

```javascript

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const contract = web3.eth.contract(abi).at(address);
const _componentList = '0x...';
const _initialFundFee = '0x...';

contract.initialize(_componentList, _initialFundFee, (err) => {
  if (err) {
    return console.error(err);
  }
});
```

### abi
> you can get the [abi](http://www.olympus.io/olympusProtocols/fund/abi) and bytecode from our API 

### bytecode
> you can get the [bytecode](http://www.olympus.io/olympusProtocols/fund/bytecode) and bytecode from our API 
