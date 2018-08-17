# Basic Index

### Introduction
An index is an indicator or measure of something, and in finance, it typically refers to a statistical measure of change in a securities market. In the case of financial markets, stock and bond market indexes consist of a hypothetical portfolio of securities representing a particular market or a segment of it. Olympus Basic Index contains basic interfaces that an index needs. The document serves as a guideline to build applications and tools to serve a new rising group of cryptocurrency product creators and investment managers.

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
      public checkLength(_tokens, _weights) checkWeights(_weights);
```

#### &emsp;Parameters
> _name: Index name </br>
  _symbol: Index symbol (The derivative is ERC20 compatible, so it follows the rules of the ERC20 standard. For example: the symbol length can be any, but it's recommended to keep it between two to five characters for convenience when displaying) </br>
  _description: Index description </br>
  _category: Index category </br>
  _decimals: Index decimals (normally it should be 18) </br>
  _tokens: The token addresses that the index will buy, sell and rebalance </br>
  _weights: The weights of the tokens </br>

#### &emsp;Example code
```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Basic Index";
const category = "YH";
const decimals = 18;
const tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a","0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"]
const weights = [50,50];

// Get gas price
const gasPrice
web3.eth.getGasPrice((err, price)=>{
  if (err) {
    return console.error(err);
  }
  gasPrice = price;
})

// Get gas limit
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

// Deploy and get index address
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
          // Now the index is deployed,you can get the deployed index address.
          console.log(newIndex.address)
        }
      }));
```

### Basic info
> The code below shows how to get index' basic information, including index' name, symbol, description, category and decimals.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address); // address: deployed index contract address
// Name
indexContract.name((err,name)=>{
  if (err) {
    return console.error(err);
  }
  console.log(name)
})
// Symbol
indexContract.symbol((err,symbol)=>{
  if (err) {
    return console.error(err);
  }
  console.log(symbol)
})
// Description
indexContract.description((err,description)=>{
  if (err) {
    return console.error(err);
  }
  console.log(description)
})
// Category
indexContract.category((err,category)=>{
  if (err) {
    return console.error(err);
  }
  console.log(category)
})
// Decimals
indexContract.decimals((err,decimals)=>{
  if (err) {
    return console.error(err);
  }
  console.log(decimals)
})
```

### Interface

#### 1. initialize

```javascript
function initialize(address _componentList, uint _rebalanceDeltaPercentage) external onlyOwner;
```

#### &emsp;Description
> Initialize the Index, after which it is listed in the Olympus Product List and opened up for investment.

#### &emsp;Parameters
> _componentList: address of the Olympus component list (The deployed component list address can be retrieved by clicking on the link at the end of the doc)</br>
> _rebalanceDeltaPercentage: the percentage of change that will trigger the auto rebalance process. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. The following example values correspond to the following percentages:</br>
    1 = 0.01%</br>
    10 = 0.1%</br>
    100 = 1%</br>
    1000 = 10%</br>
    10000 = 100%</br>

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _componentList = '0x...';
const _rebalanceDeltaPercentage = 1000;
indexContract.initialize(_componentList, _rebalanceDeltaPercentage, {from: web3.eth.accounts[0]}, (err) => {
  if (err) {
    return console.error(err);
  }
});
```

#### 2. buyTokens

```javascript
function buyTokens() external returns(bool);
```

#### &emsp;Description
> Index manager or bot system executes the function to allocate the Ether, accumulated through investment, to the tokens defined in the index.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.buyTokens((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

#### 3. rebalance

```javascript
function rebalance() public  returns (bool success);
```

#### &emsp;Description
> Traditionally, an index fund holds a certain percentage of tokens. Over time the value of these tokens might change, and thus their percentage of the total asset value in the fund might decrease or increase. To solve this issue there is a rebalance function. This function will sell some tokens for which the percentage of the total value increased, and buy some tokens for which the percentage of the total value decreased.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code

> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

function rebalance(callback){
  indexContract.rebalance((err, result) => {
    if (err) {
      return callback(err)
    }
    if(result == false){
      // Note: Instead of checking the result directly, you might need to set up a system to wait for the transaction to be mined to check the result
      rebalance(callback)
    }else (result == true){
      callback(null,result)
    }
}

rebalance((err,result)=>{
  if (err) {
    return console.log(err)
  }
})
});
```

#### 4. withdraw

```javascript
function withdraw() external returns(bool);
```

#### &emsp;Description
> This function is for investors to withdraw their investment.

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

#### 5. close

```javascript
function close() public onlyOwner returns(bool success);
```

#### &emsp;Description
> Close the index to stop investors from investing on the index, this function also sells all the tokens to get the ETH back. (Note: After closing the index, investors can still withdraw their investment)

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.close((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi
> You can get the [abi](http://www.olympus.io/olympusProtocols/index/abi) from our API.

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/index/bytecode) from our API.
