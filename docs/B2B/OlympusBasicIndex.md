Basic Index
=====

[TOC]

### Introduction

A cryptocurrency index is a vehicle that allows investors to mimic the investment returns of a basket of underlying tokens.  Olympus Basic Index contains the basic interfaces that an index needs. This document walks you through the basic template for an index.

### Constructor

``` {.sourceCode .javascript}
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

####  Parameters

> 1.  name: Index name
> 2.  symbol: Index symbol (The index is ERC20 compatible, so it follows the rules of the ERC20 standard. For example: the symbol length can be any, but it's recommended to keep it between two to five characters for convenience when displaying)
> 3.  description: Index description
> 4.  category: Index category
> 5.  decimals: Index decimals (normally it should be 18)
> 6.  tokens: The token addresses that the index will buy, sell and rebalance
> 7.  weights: The weights of the tokens

####  Example code

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Basic Index";
const category = "YH";
const decimals = 18;
const tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a",
  "0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"]
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

The code below shows how to get an index's basic information, including index's name, symbol, description, category and decimals.

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

1. initialize
-------------

``` {.sourceCode .javascript}
function initialize(address _componentList,
  uint _rebalanceDeltaPercentage) external onlyOwner;
```

####  Description

Initialize the Index, after which it is listed in the Olympus Product List and opened up for investment.

####  Parameters

> 1.  componentList: address of the Olympus component list (The deployed component list address can be retrieved by clicking on the link at the end of the doc)
> 2.  rebalanceDeltaPercentage: the percentage of change that will trigger the auto rebalance process. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. The following example values correspond to the following percentages:
>     -   1 = 0.01%
>     -   100 = 1%
>     -   1000 = 10%
>     -   10000 = 100%

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _componentList = '0x...';
const _rebalanceDeltaPercentage = 1000;
indexContract.initialize(_componentList, _rebalanceDeltaPercentage,
  {from: web3.eth.accounts[0]}, (err) => {
    if (err) {
    return console.error(err);
  }
});
```

2. buyTokens
------------

``` {.sourceCode .javascript}
function buyTokens() external onlyOwner returns(bool);
```

####  Description

Index manager executes the function to allocate the Ether, accumulated through investment, to the tokens defined in the index.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.buyTokens((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

3. rebalance
------------

``` {.sourceCode .javascript}
function rebalance() public onlyOwner returns (bool success);
```

####  Description

Traditionally, an index fund holds a certain percentage of tokens. Over time the value of these tokens might change, and thus their percentage of the total asset value in the fund might decrease or increase. To solve this issue there is a rebalance function. This function will sell some tokens for which the percentage of the total value increased, and buy some tokens for which the percentage of the total value decreased.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

function rebalance(callback){
  indexContract.rebalance((err, result) => {
    if (err) {
      return callback(err)
    }
    if(result == false){
    // Note: Instead of checking the result directly,
    // you might need to set up a system to wait for the transaction
    // to be mined to check the result
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

4. withdraw
-----------

``` {.sourceCode .javascript}
function withdraw() external returns(bool);
```

####  Description

This function is for investors to withdraw their investment.

####  Returns

> Whether the function executed successfully or not.

####  Example code

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

5. close
--------

``` {.sourceCode .javascript}
function close() public onlyOwner returns(bool success);
```

####  Description

Close the index to stop investors from investing on the index. This function also sells all of the tokens for ETH. (Note: After closing the index, investors can still withdraw their investment)

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.close((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi & bytecode

> You can get the [abi & bytecode](../contracts/templateList.json) from our API.
