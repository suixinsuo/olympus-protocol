# Fund

### Introduction

An investment fund is a supply of capital belonging to numerous investors used to collectively purchase securities while each investor retains ownership and control of his own shares. The Olympus Basic Fund contains basic interfaces that a fund needs.

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
const description = "YH's Basic Fund";
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
> The code below shows how to get fund's basic information, including fund's name, symbol, category and decimals.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
// Name
fundContract.name((err,name)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(name)
})
// Symbol
fundContract.symbol((err,symbol)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(symbol)
})
// Description
fundContract.description((err,description)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(description)
})
// Category
fundContract.category((err,category)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(category)
})
// Decimals
fundContract.decimals((err,decimals)=>{
  if (err) {
    return console.error(err);
  }
  conosle.log(decimals)
})
```

### Interface

#### 1. initialize
```javascript
function initialize(address _componentList) external onlyOwner;
```

#### &emsp;Description
> Initialize the fund contract that was created before, with the specified configurations. It will also be registered in the Olympus Product List and users can start investing into the fund after calling this function.

#### &emsp;Parameters
> \_componentList: Address of the Olympus componentlist (The deployed componentlist address can be retrieved by clicking on the link at the end of the doc)</br>

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const fundContract = web3.eth.contract(abi).at(address);
const _componentList = "0x...";
fundContract.initialize(_componentList, {from: web3.eth.accounts[0]}, err => {
  if (err) {
    return console.error(err);
  }
});
```

#### 2. invest

```javascript
function invest() public
        payable
      returns(bool)
```

#### &emsp;Description
> Invest in the fund by calling the invest function while sending Ether to the fund.

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
    return console.log(err)
  }
});
```

#### 3. buyTokens

```javascript
function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
    public onlyOwner returns(bool);
```

#### &emsp;Description
> Call the function to buy any combination of tokens.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Parameters
> _exchangeId: You can choose which exchange will be used to trade.</br>
  _tokens: Tokens to buy.</br>
  _amounts: The corresponding amount of tokens to buy.</br>
  _minimumRates: The minimum amount of tokens per ETH in wei.</br>

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _exchangeId = 0x0;
const _tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a","0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"];
const _amounts = [10**17,10**17];
const _minimumRates = [0,0];

fundContract.buyTokens(_exchangeId, _tokens, _amounts, _minimumRates, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

#### 4. sellTokens

```javascript
function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
      public onlyOwner returns (bool);
```

#### &emsp;Description
> Call the function for fund manager to sell any combination of tokens that are available in the fund.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Parameters
> _exchangeId: You can choose which exchange will be used to trade.</br>
  _tokens: Tokens to sell.</br>
  _amounts: The corresponding amount of tokens to sell.</br>
  _minimumRates: The minimum amount of tokens per ETH in wei.</br>

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);
const _exchangeId = 0x0;
const _tokens = ["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a","0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"];
const _amounts = [10**17,10**17];
const _minimumRates = [0,0];

fundContract.sellTokens(_exchangeId, _tokens, _amounts, _minimumRates, (err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

#### 5. withdraw

```javascript
function withdraw() external returns(bool);
```

#### &emsp;Description
> This function is for investors to withdraw all their investment.

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.withdraw((err, result) => {
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
> Close fund to stop investors from investing on the fund, this function also sells all the tokens to get the ETH back. (Note: After closing the fund, investors can still withdraw their investment.)

#### &emsp;Returns
> Whether the function executed successfully or not.

#### &emsp;Example code
> The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fundContract = web3.eth.contract(abi).at(address);

fundContract.close((err, result) => {
  if (err) {
    return console.log(err)
  }
});
```

### abi
> You can get the [abi](http://www.olympus.io/olympusProtocols/fund/abi) from our API

### bytecode
> You can get the [bytecode](http://www.olympus.io/olympusProtocols/fund/bytecode) from our API

### componentList address
> You can get the [componentListAddress](http://www.olympus.io/olympusProtocols/marketplace/abi) from our API
