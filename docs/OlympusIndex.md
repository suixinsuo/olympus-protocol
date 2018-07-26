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

### Basic info
> The code below shows how to get index's basic information, including fund's name, symbol, category and decimals.
```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
// name
indexContract.name((err,name)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(name)
})
// symbol
indexContract.symbol((err,symbol)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(symbol)
})
// description
indexContract.description((err,description)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(description)
})
// category
indexContract.category((err,category)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(category)
})
// decimals
indexContract.decimals((err,decimals)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(decimals)
})
```

### Interface
#### 1. initialize

```javascript
function initialize(address _componentList, uint _initialFundFee) onlyOwner external payable;
```
#### &emsp;Description
> Initialize the Index then you can find it from olympus marketplace and you can invest it. (Note: The derivative has to hold some MOT as the possible fee for calling components. So is required to transfer some MOT to your Index)

#### &emsp;Parameters
> _componentList: address of olympus componentlist (please refer this to xxxxx) </br>
  _initialFundFee: management fee of index
  value: the initial balance of the index

#### &emsp;Example code

> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _componentList = '0x...';
const _initialFundFee = '0x...';
const initialBalance = 1 ** 17
indexContract.initialize(_componentList, _initialFundFee, {from: web3.eth.accounts[0],value: initialBalance}, (err) => {
  if (err) {
    return console.error(err);
  }
});
```

#### 2. invest
```javascript
function invest() public payable
     whenNotPaused
     whitelisted(WhitelistKeys.Investment)
     withoutRisk(msg.sender, address(this), ETH, msg.value, 1)
     returns(bool) ;
```
#### &emsp;Description
> Invest in the index by calling the invest function while sending Ether to the index fund. If the whitelist is enabled, it will check if your address is in the investment whitelist. Furthermore, the parameters will also be sent to the risk provider for assessment.

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

#### 3. buyTokens
```javascript
function buyTokens() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool);
```
#### &emsp;Description
> Index manager execute the function to buy tokens that are defined in index using the investor's investment.

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

#### 4. rebalance
```javascript
function rebalance() public onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns (bool success);
```
#### &emsp;Description
> Traditionally, an index fund holds a certain percentage of tokens. Over time the value of these tokens might change, and thus their percentage of the complete asset value in the value might decrease or increase. To solve this issue there is a rebalance function. This function will sell some tokens for which the percentage of the total value increased, and buy some tokens for which the percentage of the total value decreased.
As the blockchain limits the number of operations done per transaction, this function has a built-in feature for executing this function over multiple transaction.
So to be sure that the function will be completed, as long as the result of the function is false, the function should be called again.
Once the rebalance function returns true, the rebalance will be completed, and can only be called again after the interval period has passed.

#### &emsp;Returns
> Because we have multiple step support. If it return false when the function needs to execute again until all of steps are finished, and if true the function is finished. If there is any issue, rebalance will revert

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

#### 5. setManagementFee

```javascript
function setManagementFee(uint _fee) external onlyOwner;
```
#### &emsp;Description
> Set the management fee percentage. This is being calculated with a denominator, so the lowest value is 1 for 0.01%, and the highest value is 10000 for 100%. Usually, indexes should not have a 100% fee, but this is only restricted to be equal to or under 100% (10000). The following example values correspond to the following percentages:</br>
1 = 0.01% fee</br>
10 = 0.1% fee</br>
100 = 1% fee</br>
1000 = 10% fee</br>
10000 = 100% fee</br>

#### &emsp;Parameters
> _fee: The percentage of investor's investment that will be used as management fee (Note: _fee must equal to or bigger than 0 and less than 10000)

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const _fee = 100;
indexContract.setManagementFee(_fee, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

#### 6. requestWithdraw

```javascript
function requestWithdraw(uint amount) external
      whenNotPaused
      withoutRisk(msg.sender, address(this), address(this), amount, getPrice());
```
#### &emsp;Description
> Investor can use this function to request to withdraw his investment.(Note: The investment will be withdraw after the index's manager execute the withdraw function.)

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
#### 7. withdraw

```javascript
function withdraw() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool);
```
#### &emsp;Description
> This function is for index's manager. Investors that has requested to withdraw their investment will get their investment back after the index's management executes this function.

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
#### 8. withdrawFee

```javascript
function withdrawFee(uint amount) external onlyOwner whenNotPaused returns(bool);
```
#### &emsp;Description
> This function is for index's manager to withdraw index management fee.

#### &emsp;Parameters
> amount: Amount of management fee the index manager would like to withdraw.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const amount = 10 ** 17;
indexContract.withdrawFee(amount, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```
#### 9. enableWhitelist

```javascript
function enableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool)
```
#### &emsp;Description
> Owner of the Index can enable a category of whitelist to protect the index.
The following three categories of whitelist are available: </br>
0: Investment</br>
1: Maintenance </br>
2: Admin</br>
If type 0 Investment whitelist is enabled, only users' addresses that are added to the whitelist are allowed to invest on the index.
If type 1 Maintenance whitelist is enabled, only users' addresses that have been added to the whitelist are allowed to trigger the withdraw process, rebalance the tokens or trigger the allocation process; otherwise, only the owner of the index can perform those actions.
Type 2 Admin whitelist is not used on Index for now.

#### &emsp;Parameters
> \_key: A specific category of whitelist to be enabled for the index. Three categories of whitelist are available:</br>
0: Investment</br>
1: Maintenance </br>
2: Admin</br>

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const key = 0; // To enable the Investment whitelist
indexContract.enableWhitelist(key, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```
#### 10. setAllowed

```javascript
function setAllowed(address[] accounts, WhitelistKeys _key, bool allowed) public onlyOwner returns(bool)
```
#### &emsp;Description
> After enabling a specific category of whitelist, the owner of the index can add/remove accounts from the whitelist.

#### &emsp;Parameters
> accounts: Array of addresses</br>
> \_key: A specific category of whitelist to be enabled for the index</br>
> allowed: Set the parameter to true to add accounts to the whitelist; false to remove accounts from the whitelist.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const accounts = ['0x7b990738012Dafb67FEa47EC0137842cB582AD71','0x1cD5Fcc6d1d3A2ECdd71473d2FCFE49769643CF2']
const key = 0; // Investment whitelist
const allowed = true;
indexContract.setAllowed(accounts, key, allowed, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```
#### 11. disableWhitelist

```javascript
function disableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool)
```

#### &emsp;Description
> Owner of the index can disable a category of whitelist that has been enabled before.

#### &emsp;Parameters
> \_key: A specific category of whitelist to be enabled for the index. Three categories of whitelist are available:</br>
0: Investment</br>
1: Maintenance </br>
2: Admin</br>

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);
const key = 0; // To disable the Investment whitelist
indexContract.disableWhitelist(key, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```
#### 12. close

```javascript
function close() public onlyOwner returns(bool success);
```
#### &emsp;Description
> Close index to stop investors from investing on the index, this function also sells all the tokens to get the ETH back. (Note: After closing the index, investors can still withdraw their investment and index managers can also withdraw their management fee.)

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
> You can get the [abi](http://www.olympus.io/olympusProtocols/index/abi) from our API

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/index/bytecode) from our API
