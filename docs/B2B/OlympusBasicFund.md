Basic Fund
==========

[TOC]

### Introduction

A cryptocurrency fund is a vehicle that allows an investment manager to pool together ETH from investors for the purpose of investing while having the investors retain control of their ETH. The Olympus Basic Fund contains basic interfaces that a fund needs. This document walks you through the basic template for a fund.

### Constructor

``` {.sourceCode .javascript}
constructor(
  string _name,
  string _symbol,
  string _description,
  string _category,
  uint _decimals
) public;
```

####  Parameters

> 1. \_name: Fund name
> 2. \_symbol: Fund symbol (The fund is ERC20 compatible, so it follows the rules of the ERC20 standard. For example: the symbol length can be any, but it's recommended to keep it between two to five characters for convenience when displaying)
> 3. \_description: Fund description
> 4. \_category: Fund category
> 5. \_decimals: Fund decimals (normally it should be 18)

####  Example code

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Basic Fund";
const category = "YH";
const decimals = 18;

// Get gas price
const gasPrice
web3.eth.getGasPrice
  ((err, price)=>{
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

// Deploy and get fund contract address
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
      // Now the fund is deployed, you can get the fund contract address.
      console.log(newFund.address)
    }
}));
```

### Basic info

The code below shows how to get a fund's basic information, including the fund's name, symbol, description, category and decimals.

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
  console.log(name)
})
// Symbol
fundContract.symbol((err,symbol)=>{
  if (err) {
    return console.error(err);
  }
  console.log(symbol)
})
// Description
fundContract.description((err,description)=>{
  if (err) {
    return console.error(err);
  }
  console.log(description)
})
// Category
fundContract.category((err,category)=>{
  if (err) {
    return console.error(err);
  }
  console.log(category)
})
// Decimals
fundContract.decimals((err,decimals)=>{
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
function initialize(address _componentList) external onlyOwner;
```

####  Description

Initialize the fund contract that was created before, with the specified configurations. It will also be registered to the Olympus Product List and users can start investing into the fund after calling this function.

####  Parameters

> \_componentList: Address of the Olympus component list (The deployed component list address can be retrieved by clicking on the link at the end of the doc)

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));

const fundContract = web3.eth.contract(abi).at(address);
const _componentList = "0x...";
fundContract.initialize(_componentList, {from: web3.eth.accounts[0]},
 err => {
  if (err) {
    return console.error(err);
  }
});
```

2. buyTokens
------------

``` {.sourceCode .javascript}
function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens,
  uint[] _amounts, uint[] _rates)
    public onlyOwner returns(bool);
```

####  Description

Call the function to buy any combination of tokens.

####  Returns

> Whether the function executed successfully or not.

####  Parameters

> 1. \_exchangeId: You can choose which exchange will be used to trade. If an empty string is passed, it will automatically choose the exchange with the best rates.
> 2. \_tokens: ERC20 addresses of the tokens to buy.
> 3. \_amounts: The corresponding amount of tokens to buy.
> 4. \_rates: The minimum return amount of tokens per ETH in wei.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _exchangeId = 0x0;
const _tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a",
  "0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"];
const _amounts = [10**17,10**17];
const _rates = [0,0];

fundContract.buyTokens(_exchangeId, _tokens, _amounts, _rates,
  (err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

3. sellTokens
-------------

``` {.sourceCode .javascript}
function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens,
  uint[] _amounts, uint[] _rates)
    public onlyOwner returns (bool);
```

####  Description

Call the function to sell any combination of tokens that are available in the fund.

####  Returns

> Whether the function executed successfully or not.

####  Parameters

> 1. \_exchangeId: You can choose which exchange will be used to trade. If an empty string is passed, it will automatically choose the exchange with the best rates.
> 2. \_tokens: ERC20 addresses of the tokens to sell.
> 3. \_amounts: The corresponding amount of tokens to sell.
> 4. \_rates: The minimum return amount of ETH per token in wei.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _exchangeId = 0x0;
const _tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a",
  "0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"];
const _amounts = [10**17,10**17];
const _rates = [0,0];

fundContract.sellTokens(_exchangeId, _tokens, _amounts, _rates,
  (err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

4. tokenSwap
-------------

``` {.sourceCode .javascript}
function tokenSwap(bytes32 _exchangeId, ERC20Extended _src,
    ERC20Extended _dest, uint _amount, uint _rate)
        public onlyOwner returns (bool);
```

####  Description

Call the function to swap between two tokens that are available in the fund.

####  Returns

> Whether the function executed successfully or not.

####  Parameters

> 1. \_exchangeId: You can choose which exchange will be used to trade. If an empty string is passed, it will automatically choose the exchange with the best rates.
> 2. \_src: ERC20 addresses of the token to swap, the src token cannot be ETH.
> 3. \_dest: ERC20 addresses of the token you want to get, the dest token cannot be ETH.
> 4. \_amount: The amount of src token to swap.
> 5. \_rate: The exchange rate from src token to dest token in wei.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _exchangeId = 0x0;
const _src = "0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a";
const _dest = "0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"];
const _amount = 10**17;
const _rate = 0;

fundContract.tokenSwap(_exchangeId, _src, _dest, _amount, _rate,
  (err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

5. getTokens
-------------

``` {.sourceCode .javascript}
function getTokens() external view returns(address[], uint[]);
```

####  Description

Call the function to get all the underlying tokens with their amounts.

####  Returns

> Two Arrays {[Tokens],[Amounts]} of the same length, where the token at the position 0 have the amount at the position 0.

####  Example code

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

6. tokensWithAmount
-------------

``` {.sourceCode .javascript}
function tokensWithAmount() public view
    returns( ERC20Extended[] memory);
```

####  Description

Call the function to get the actual active tokens with amounts, tokens that have been all sold will not be returned.

####  Returns

> Array of the actual active tokens with amounts.

####  Example code

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

7. changeStatus
-------------

``` {.sourceCode .javascript}
function changeStatus(DerivativeStatus _status)
    public onlyOwner returns(bool);
```

####  Description

Call the function to change status in the case when the fund is not New or Closed.

####  Returns

> Whether the function executed successfully or not.

####  Parameters

> 1. \_status: new status of the fund.
The following status corresponds to a number value:
>     -   New: 0
>     -   Active: 1
>     -   Paused: 2
>     -   Closed: 3
0 and 3 cannot be passed as parameter.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const status = 2; // The status cannot be 0 or 3

fundContract.changeStatus(status,
  (err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

8. getPrice
-------------

``` {.sourceCode .javascript}
function getPrice() public view returns(uint);
```

####  Description

Call the function to get the unit price of the fund.

####  Returns

> The unit price of the fund.

####  Example code

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

9. getAssetsValue
-------------

``` {.sourceCode .javascript}
function getAssetsValue() public view returns (uint);
```

####  Description

Call the function to get the total value calculated based on the value of the fund's underlying assets.

####  Returns

> The total value calculated based on the value of the fund's underlying assets.

####  Example code

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

10. getETHBalance
-------------

``` {.sourceCode .javascript}
function getETHBalance() public view returns(uint);
```

####  Description

Call the function to get the remaining ETH balance of the fund.

####  Returns

> The remaining ETH balance of the fund.

####  Example code

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

11. withdraw
-----------

``` {.sourceCode .javascript}
function withdraw() external returns(bool);
```

####  Description

This function is for investors to withdraw their investment in Ether.

####  Returns

> Whether the function executed successfully or not.

####  Example code

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

12. close
--------

``` {.sourceCode .javascript}
function close() public onlyOwner returns(bool success);
```

####  Description

Close the fund to stop investors from investing into the fund. this function also sells all of the tokens for ETH. (Note: After closing the fund, investors can still withdraw their investment.)

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.close((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi & bytecode

> You can get the [abi & bytecode](../contracts/templateList.json) from our API.
