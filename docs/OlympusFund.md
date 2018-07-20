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

> \_name: Fund name</br> > \_symbol: Fund symbol (The derivative is ERC20 compatible, so it follows the rules of ERC20. For example: the symbol length can be any, but it's better to keep in from 2 - 5)</br> > \_description: Fund description</br> > \_category: Fund category</br> > \_decimals: Fund decimals (normally it should be 18)</br>

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

> Initialize the fund that was created with specified configurations and will be registered in Olympus Product List and you can invest it. (Note: The derivative has to hold some MOT as the possible fee for calling components. So it is required to transfer some MOT to your Fund)

#### &emsp;Parameters

> \_componentList: Address of olympus componentlist </br>
  \_initialFundFee: The fee that the owner will take from the investments. Must be based in DENOMINATOR, so 1% is 1000.
> value: The initial balance of the fund

#### &emsp;Example code

> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const fundContract = web3.eth.contract(abi).at(address);
const _componentList = "0x...";
const _initialFundFee = "0x...";
const initialBalance = 1 ** 17
fundContract.initialize(_componentList, _initialFundFee, {from: web3.eth.accounts[0],value: initialBalance}, err => {
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
> Invest in the fund by calling the invest function while sending Ether to the fund. If the whitelist is enabled, it will check if your address is in the investment whitelist. Furthermore, the parameters will also be sent to the risk provider for assessment.
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
    return console.log()
  }
});
```

#### 3. setManagementFee 

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
> _fee: The percentage of investor's investment, that will be as management fee (Note: _fee must equal to or bigger than 0 and less than 10000)

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const indexContract = web3.eth.contract(abi).at(address);

indexContract.setManagementFee((err, result) => {
  if (err) {
    return console.log()
  }
});
```
### abi
> you can get the [abi](http://www.olympus.io/olympusProtocols/fund/abi) and bytecode from our API 

### bytecode
> you can get the [bytecode](http://www.olympus.io/olympusProtocols/fund/bytecode) and bytecode from our API 
