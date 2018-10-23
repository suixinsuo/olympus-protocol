Index
=====

### Introduction

A cryptocurrency index is a vehicle that allows investors to mimic the investment returns of a basket of underlying tokens. This document walks you through the customized template for an index created by the Olympus team.

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
  public;
```

#### Parameters

> 1.  \_name: Index name
> 2.  \_symbol: Index symbol (The index is ERC20 compatible, so it follows the rules of the ERC20 standard. For example: the symbol length can be any, but it's recommended to keep it between two to five characters for convenience when displaying)
> 3.  \_description: Index description
> 4.  \_category: Index category
> 5.  \_decimals: Index decimals (normally it should be 18)
> 6.  \_tokens: The token addresses that the index will buy, sell and rebalance
> 7.  \_weights: The weights of the tokens

#### Example code

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));

const name = "YH";
const symbol = "YH";
const description = "YH's Index";
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

// Deploy and get index contract address
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
      // Index deployed, you can get the deployed index address,
      // do whatever you need to do.
      console.log(newIndex.address)
    }
}));
```

### Basic info

The code below shows how to get an index's basic information, including the index's name, symbol, description, category and decimals.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
// address: deployed index address
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
function initialize(
        address _componentList,
        uint _initialFundFee,
        uint _rebalanceDeltaPercentage
  )
  external onlyOwner payable;
```

#### Description

Initialize the Index, after which it is listed in the Olympus Product List and opened up for investment. (Note: The derivative has to hold some MOT as the possible fee for calling components. So it is required to transfer some MOT to your deployed OlympusIndex.)

#### Parameters

> \_componentList: address of the Olympus component list (The deployed component list address can be retrieved by clicking on the link at the end of the doc)
>
> \_rebalanceDeltaPercentage: the percentage of change that will trigger the auto rebalance process. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. The following example values correspond to the following percentages:
>
> -   1 = 0.01%
> -   100 = 1%
> -   1000 = 10%
> -   10000 = 100%
>
> \_initialFundFee: the initial balance of the index

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _componentList = '0x...';
const _initialFundFee = '0x...';
const _rebalanceDeltaPercentage = 1000;
indexContract.initialize(_componentList, _rebalanceDeltaPercentage,
 _initialFundFee, {from: web3.eth.accounts[0], value: initialBalance},
  (err) => {
    if (err) {
      return console.error(err);
    }
});
```

2. setMultipleTimeIntervals
---------------------------

``` {.sourceCode .javascript}
function setMultipleTimeIntervals(bytes32[] _timerNames,
  uint[] _secondsList) external onlyOwner;
```

#### Description

Index manager can configure the withdraw frequency, buy token (Ether allocation) frequency and rebalance frequency for their index. By setting up the frequency, the bot system will execute withdraw/buy token and rebalance based on the configured frequency.

#### Parameters

> 1.  \_timerNames: Array of the bytes32 encoded strings of the frequency names: RedeemFrequency, BuyTokensFrequency and RebalanceFrequency.
> 2.  \_secondsList: Array of the frequency for the redeem, buy tokens and rebalance functions, should be converted to use number of seconds as the unit of time.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const timerNames: string[] = [
  // RedeemFrequency's bytes32 encoded string
  '0x576974686472617750726f7669646572',
  // BuyTokensFrequency's bytes32 encoded string
  '0x427579546f6b656e73',
  // RebalanceFrequency's bytes32 encoded string
  '0x526562616c616e636550726f7669646572',
];

const redeemFrequencyInDays = 1;
const buyTokensFrequencyInDays = 2;
const rebalanceFrequencyInDays = 1;

const secondsList = [
  //Convert days to seconds
  redeemFrequencyInDays * 60 * 60 * 24,
  buyTokensFrequencyInDays * 60 * 60 * 24,
  rebalanceFrequencyInDays * 60 * 60 * 24,
];

indexContract.setMultipleTimeIntervals
  (timerNames, secondsList, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

3. buyTokens
------------

``` {.sourceCode .javascript}
function buyTokens() external onlyOwnerOrWhitelisted
  (WhitelistKeys.Maintenance) whenNotPaused returns(bool);
```

#### Description

Index manager executes the function to buy tokens that are defined in the index using the investor's funds.

#### Returns

> Whether the function executed successfully or not.

#### Example code

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

4. getTokens
------------

``` {.sourceCode .javascript}
function getTokens() public view
  returns (address[] _tokens, uint[] _weights);
```

#### Description

Call the function to get all the tokens with their weights.

#### Returns

> Two Arrays {[Tokens],[Weights]} of the same length, where the token at the position 0 have the weight at the position 0.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getTokens((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

5. tokensWithAmount
-------------------

``` {.sourceCode .javascript}
function tokensWithAmount() public view
  returns(ERC20Extended[] memory);
```

#### Description

Call the function to get the actual active tokens with amounts, tokens that have been all sold will not be returned.

#### Returns

> Array of the actual active tokens with amounts.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.tokensWithAmount((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

6. getPrice
-----------

``` {.sourceCode .javascript}
function getPrice() public view returns(uint);
```

#### Description

Call the function to get the unit price of the index.

#### Returns

> The unit price of the index.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getPrice((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

7. getAssetsValue
-----------------

``` {.sourceCode .javascript}
function getAssetsValue() public view returns (uint);
```

#### Description

Call the function to get the total value calculated based on the value of the index's underlying assets.

#### Returns

> The total value calculated based on the value of the index's underlying assets.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getAssetsValue((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

8. getETHBalance
----------------

``` {.sourceCode .javascript}
function getETHBalance() public view returns(uint);
```

#### Description

Call the function to get the remaining ETH balance of the index.

#### Returns

> The remaining ETH balance of the index.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.getETHBalance((err, result) => {
    if (err) {
      return console.log(err)
    }
});
```

9. addOwnerBalance
------------------

``` {.sourceCode .javascript}
function addOwnerBalance() external payable;
```

#### Description

This function is for the fund manager. Fund manager can send ETH to the index, the ETH will be added to the existing management fee.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const balance = 1 ** 18;

fundContract.addOwnerBalance
  (from: web3.eth.accounts[0], value: balance}, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

10. rebalance
-------------

``` {.sourceCode .javascript}
function rebalance() public onlyOwnerOrWhitelisted
  (WhitelistKeys.Maintenance) whenNotPaused returns (bool success);
```

#### Description

Traditionally, an index fund holds a certain percentage of tokens. Over time the value of these tokens might change, and thus their percentage of the complete asset value in the value might decrease or increase. To solve this issue there is a rebalance function. This function will sell some tokens for which the percentage of the total value increased, and buy some tokens for which the percentage of the total value decreased. As the blockchain limits the number of operations done per transaction, this function has a built-in feature for executing this function over multiple transactions. So to be sure that the function will be completed, as long as the result of the function is false, the function should be called again. Once the rebalance function returns true, the rebalance will be completed, and can only be called again after the interval period has passed.

#### Returns

> In cases where there are a lot of tokens in the index, we need to process rebalancing in multiple steps due to gas limits. The function will return false for each step and then return true once all of the steps in the rebalancing are complete. If there are any issues, rebalance will revert.

#### Example code

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
      // Note: Instead of checking the result directly, you might
      // need to set up a system to wait for the transaction
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

11. setManagementFee
--------------------

``` {.sourceCode .javascript}
function setManagementFee(uint _fee) public onlyOwner;
```

#### Description

Set the management fee percentage. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. This value is only restricted to be less than 100% (10000). The following example values correspond to the following percentages:

-   1 = 0.01%
-   100 = 1%
-   1000 = 10%
-   10000 = 100%

#### Parameters

> \_fee: The percentage of investors' funds that will be set aside for management fee (Note: fee must be equal to or bigger than 0 and less than 10000), refer to the list above to get the correct value.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _fee = 100;
indexContract.setManagementFee(_fee, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

12. withdraw
------------

``` {.sourceCode .javascript}
function withdraw() external onlyOwnerOrWhitelisted
  (WhitelistKeys.Maintenance) whenNotPaused returns(bool);
```

#### Description

This function is for the index manager. Investors that have requested to withdraw their investment will get their investment back after the index manager or bot system executes this function.

#### Returns

> Whether the function executed successfully or not.

#### Example code

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

13. withdrawFee
---------------

``` {.sourceCode .javascript}
function withdrawFee(uint amount) external onlyOwner
  whenNotPaused returns(bool);
```

#### Description

This function is for the index manager to withdraw the index management fee.

#### Parameters

> amount: Amount of management fee the index manager would like to withdraw.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const amount = 10 ** 17;
indexContract.withdrawFee(amount, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

14. enableWhitelist
-------------------

``` {.sourceCode .javascript}
function enableWhitelist(WhitelistKeys _key, bool enable)
  external onlyOwner returns(bool);
```

#### Description

Owner of the Index can enable a category of whitelist to facilitate access control for the index. The following three categories of whitelist are available:

-   0: Investment
-   1: Maintenance
-   2: Admin

If type 0 Investment whitelist is enabled, only users' addresses that are added to the whitelist are allowed to invest into the index. If type 1 Maintenance whitelist is enabled, only users' addresses that have been added to the whitelist are allowed to trigger the withdraw process, rebalance the tokens or trigger the allocation process; otherwise, only the owner of the index can perform those actions. Type 2 Admin whitelist is not used in the OlympusIndex for now.

#### Parameters

> \_key: A specific category of whitelist to be enabled for the index. The following three keys are available:
>
> -   0: Investment
> -   1: Maintenance
> -   2: Admin

> enable: Set the parameter to true to enable the selected whitelist; false to disable the selected whitelist.

#### Returns

> Whether the function executed successfully or not.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
// To enable the Investment whitelist
const key = 0;
const enable = true;
indexContract.enableWhitelist(key, enable (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

15. setAllowed
--------------

``` {.sourceCode .javascript}
function setAllowed(address[] accounts, WhitelistKeys _key,
  bool allowed) public onlyOwner returns(bool);
```

#### Description

After enabling a specific category of whitelist, the owner of the index can add and remove accounts from the whitelist.

#### Parameters

> 1.  accounts: Array of addresses
> 2.  \_key: A specific category of whitelist to be enabled for the index
> 3.  allowed: Set the parameter to true to add accounts to the whitelist; false to remove accounts from the whitelist.

#### Returns

> Whether the function executed successfully or not.

#### Example code

The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
  (new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const accounts = ['0x7b990738012Dafb67FEa47EC0137842cB582AD71',
  '0x1cD5Fcc6d1d3A2ECdd71473d2FCFE49769643CF2']
const key = 0; // Investment whitelist
const allowed = true;
indexContract.setAllowed(accounts, key, allowed, (err, result) => {
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

#### Description

Close the index to stop investors from investing into the fund. (Note: After closing the index, investors can still withdraw their investment. Index manager will not be able to withdraw all management fee until all tokens are sold.)

#### Returns

> Whether the function executed successfully or not.

#### Example code

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

17. sellAllTokensOnClosedFund
-----------------------------

``` {.sourceCode .javascript}
function sellAllTokensOnClosedFund() onlyOwnerOrWhitelisted
    (WhitelistKeys.Maintenance) public returns (bool);
```

#### Description

After a index is closed, owner or bot can call the function to sell all existing tokens.

#### Returns

> Whether the function executed successfully or not.

#### Example code

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

> You can get the [abi & bytecode](../api.html) from our API.
