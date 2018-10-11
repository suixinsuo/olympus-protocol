Fund
====

[TOC]

### Introduction

A cryptocurrency fund is a vehicle that allows an investment manager to pool together ETH from investors for the purpose of investing while having the investors retain control of their ETH. This document walks you through a customized template for a fund created by the Olympus team.

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
const description = "YH's Fund";
const category = "YH";
const decimals = 18;

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

// Deploy and get fund address
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
// address: deployed fund contract address
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
function initialize(address _componentList, uint _initialFundFee, uint _withdrawFrequency)
  external onlyOwner payable;
```

####  Description

Initialize the fund contract that was created before, with the specified configurations. It will also be registered to the Olympus Product List and users can start investing into the fund after calling this function.

####  Parameters

> 1. \_componentList: Address of the Olympus component list (The deployed component list address can be retrieved by clicking on the link at the end of the doc).
> 2. \_initialFundFee: The fee that the owner will receive for managing the fund. Must be based on DENOMINATOR, so 1% is 1000.
> 3. \_withdrawFrequency: the frequency that will trigger the auto withdraw process.
> 4. value: The initial balance of the fund.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));

const fundContract = web3.eth.contract(abi).at(address);
const _componentList = "0x...";
const _initialFundFee = "0x...";
const _withdrawFrequency = 5; // 5 seconds
const initialBalance = 1 ** 17
fundContract.initialize(_componentList, _initialFundFee, _withdrawFrequency,
  {from: web3.eth.accounts[0],value: initialBalance}, err => {
  if (err) {
    return console.error(err);
  }
});
```

2. buyTokens
------------

``` {.sourceCode .javascript}
function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens,
  uint[] _amounts, uint[] _minimumRates)
    public onlyOwnerOrWhitelisted(WhitelistKeys.Admin) returns(bool);
```

####  Description

Call the function to buy any combination of tokens.

####  Returns

> Whether the function executed successfully or not.

####  Parameters

> 1. \_exchangeId: You can choose which exchange will be used to trade. If an empty string is passed, it will automatically choose the exchange with the best rates.
> 2. \_tokens: ERC20 addresses of the tokens to buy.
> 3. \_amounts: The corresponding amount of tokens to buy.
> 4. \_minimumRates: The minimum return amount of tokens per ETH in wei.

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
const _minimumRates = [0,0];

fundContract.buyTokens(_exchangeId, _tokens, _amounts, _minimumRates,
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
  uint[] _amounts, uint[]  _rates)
    public onlyOwnerOrWhitelisted(WhitelistKeys.Admin) returns (bool);
```

####  Description

Call the function for fund manager or whitelisted fund administrator to sell any combination of tokens that are available in the fund.

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

4. getTokens
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

5. tokensWithAmount
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

6. setManagementFee
-------------------

``` {.sourceCode .javascript}
function setManagementFee(uint _fee) external onlyOwner;
```

####  Description

Set the management fee percentage. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. This is only restricted to be less than 100% (10000). The following example values correspond to the following percentages:

-   1 = 0.01%
-   100 = 1%
-   1000 = 10%
-   10000 = 100%

####  Parameters

> \_fee: The percentage of investors' funds that will be set aside for management fee (Note: fee must be equal to or bigger than 0 and less than 10000), refer to the list above to get the correct value.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _fee = 100;
fundContract.setManagementFee(_fee, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

7. getPrice
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

8. getAssetsValue
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

9. getETHBalance
-------------

``` {.sourceCode .javascript}
function getETHBalance() public view returns(uint);
```

####  Description

Call the function to get the remaining ETH balance of the fund, the accumulated fee has been deducted.

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

10. addOwnerBalance
-----------

``` {.sourceCode .javascript}
function addOwnerBalance() external payable;
```

####  Description

This function is for the fund manager. Fund manager can send ETH to the index, the ETH will be added to the existing management fee.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const balance = 1 ** 18;

fundContract.addOwnerBalance(from: web3.eth.accounts[0], value: balance}, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

11. getActiveInvestors
-------------

``` {.sourceCode .javascript}
function getActiveInvestors() external view returns(address[]);
```

####  Description

Call the function to get all the active investors.

####  Returns

> Array of all the active investors' addresses.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.getActiveInvestors((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

12. withdraw
-----------

``` {.sourceCode .javascript}
function withdraw() external onlyOwnerOrWhitelisted
  (WhitelistKeys.Maintenance) whenNotPaused returns(bool);
```

####  Description

This function is for the fund manager. Investors that have requested to withdraw their investment will get their investment back after the fund manager or bot system executes this function.

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

13. withdrawFee
--------------

``` {.sourceCode .javascript}
function withdrawFee(uint amount)
  external onlyOwner whenNotPaused returns(bool);
```

####  Description

This function is for the fund manager to withdraw the fund management fee.

####  Parameters

> amount: Amount of management fee the fund manager would like to withdraw.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const amount = 10 ** 17;
fundContract.withdrawFee(amount, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

14. enableWhitelist
------------------

``` {.sourceCode .javascript}
function enableWhitelist(WhitelistKeys _key, bool enable) external onlyOwner
  returns(bool);
```

####  Description

Owner of the fund can enable a category of whitelist to facilitate access control for the fund. The following three categories of whitelist are available:

-   0: Investment
-   1: Maintenance
-   2: Admin

If type 0 Investment whitelist is enabled, only users' addresses that are added to the whitelist are allowed to invest into the fund. If type 1 Maintenance whitelist is enabled, only users' addresses that have been added to the whitelist are allowed to trigger the withdraw process; otherwise, only the owner of the fund can trigger the withdraw process. If type 2 Admin whitelist is enabled, only users' addresses that have been added to the whitelist are allowed to buy and sell tokens in the fund; otherwise, only the owner of the fund can buy and sell tokens.

####  Parameters

> \_key: A specific category of whitelist to be enabled for the fund. The following three keys are available:
>
>  -   0: Investment
>  -   1: Maintenance
>  -   2: Admin
>  enable: Set the parameter to true to enable the selected whitelist; false to disable the selected whitelist.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
// To enable the Investment whitelist
const key = 0;
const enable = true;
fundContract.enableWhitelist(key, enable, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

15. setAllowed
-------------

``` {.sourceCode .javascript}
function setAllowed(address[] accounts, WhitelistKeys _key, bool allowed) public onlyOwner returns(bool)
```

####  Description

After enabling a specific category of whitelist, the owner of the fund can add and remove accounts from the whitelist.

####  Parameters

> 1. accounts: Array of addresses
> 2. \_key: A specific category of whitelist to be enabled for the fund
> 3. allowed: Set the parameter to true to add accounts to the whitelist; false to remove accounts from the whitelist.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const accounts = ['0x7b990738012Dafb67FEa47EC0137842cB582AD71',
  '0x1cD5Fcc6d1d3A2ECdd71473d2FCFE49769643CF2']
const key = 0; // Investment whitelist
const allowed = true;
fundContract.setAllowed(accounts, key, allowed, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

16. close
---------

``` {.sourceCode .javascript}
function close() OnlyOwnerOrPausedTimeout public returns(bool success);
```

####  Description

Close the fund to stop investors from investing into the fund. (Note: After closing the fund, investors can still withdraw their investment. Fund manager will not be able to withdraw all management fee until all tokens are sold.)

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

17. sellAllTokensOnClosedFund
---------

``` {.sourceCode .javascript}
function sellAllTokensOnClosedFund() onlyOwnerOrWhitelisted
    (WhitelistKeys.Maintenance) public returns (bool);
```

####  Description

After a fund is closed, owner or bot can call the function to sell all existing tokens.

####  Returns

> Whether the function executed successfully or not.

####  Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.sellAllTokensOnClosedFund((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi & bytecode

> You can get the [abi & bytecode](../contracts/templateList.json) from our API.
