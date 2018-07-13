# Index

### Introduction
An index is an indicator or measure of something, and in finance, it typically refers to a statistical measure of change in a securities market. In the case of financial markets, stock and bond market indexes consist of a hypothetical portfolio of securities representing a particular market or a segment of it.

### Constructor
```javascript
constructor (
      string _name,
      string _symbol,
      string _description,
      string _category,
      uint _decimals,
      address[] _tokens,
      uint[] _weights)
      checkLength(_tokens, _weights) public ;
```
#### &emsp;Parameters
> _name: Index name</br>
  _symbol: Index symbol (The derivative is ERC20 compatible, so it follow the rules of ERC20. For example: the symbol length can be any, but it's better to keep in from 2 - 5)</br>
  _description: Index description</br>
  _category: Index category</br>
  _decimals: Index decimals (normally it should be 18)</br>
  _tokens: The token addresses that the index can buy, sell and rebalance</br>
  _wights: the weights of token</br>

#### &emsp;Example code
```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Index";
const category = "YH";
const decimals = 18;
const tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a","0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"]
const weights = [50,50];

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
    tokens,
    weights,
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

// deploy and get index address
web3.eth.contract(abi).new(
      name,
      symbol,
      description,
      category,
      decimals,
      tokens,
      weights,
      {
        from: web3.eth.accounts[0],
        data: new Buffer(INDEX_PRODUCT_BINARY, 'utf8'),
        gas: gasLimit,
        gasPrice: gasPrice,
      },
      (err: Error, newIndex: any) => {
        if (err) {
          return console.error(err);
        }
        if (newIndex && newIndex.address) {
          // now the index is deployed, do whatever you need to do.
          console.log(newIndex.address)
        }
      }));
```
### Interface
#### 1. initialize 

```javascript
function initialize(address _componentList, uint _initialFundFee) onlyOwner external payable;
```
#### &emsp;Description
> Initialize the Index then you can find it from olympus marketplace and you can invest it.(component list will provide the updated providers of the component, and that using them will charge MOT, so is required to transfer some MOT to your fund)

#### &emsp;Parameters
> _componentList: address of olympus componentlist (please refer this to xxxxx) </br>
  _initialFundFee: management fee of index
  value: the initial balance of the index

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
> you can get the [abi](http://www.olympus.io/olympusProtocols/index/abi) and bytcode from our API

### bytecode
> you can get the [bytecode](http://www.olympus.io/olympusProtocols/index/bytecode) and bytcode from our API
