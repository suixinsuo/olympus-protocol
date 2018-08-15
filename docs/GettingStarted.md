[TOC]

# Getting Started

Welcome to Olympus API, the cryptocurrency financial product protocol powering fintech DApp ecosystem. In this document, we are going to present you the Olympus protocols and the basic steps get the development work on Olympus Platform started.

## Olympus Derivative Protocols

The technology of blockchain opens a gate to a lot of new distributed and secured cryptocurrencies that has become more popular. However, the nature of this world is still in the very beginning stage, with high rises and fallings of values. The market must maturate, part of the process of maturation is the creation of more complex and developed tools allowing investors to create security in their own assets.

Olympus Protocols is a set of protocols that allow developers to connect to it to provide support of financial products creation and alongside the support of the process.

Olympus Protocols are based on three levels:

- The core components: Those can be utilized for making any customized financial derivative product much easier. The core works in Olympus environment and uses MOT ([Mountain Olympus Token](https://etherscan.io/token/0x263c618480dbe35c300d8d5ecda19bbb986acaed)) as an internal currency for concrete transactions.

- Financial product templates: Those can be used as bases to create your own financial derivatives by connecting to different chosen core components and are already ready to deliver. It has different variations according to different use cases.

- The DApps: External applications (web/mobile apps) that use Olympus Protocols in different ways for any financial products.

In this documentation, we try to separate to two parts, for creating portals/tools facing to fund managers/organizations, we call it [B2B](./B2B). And we call it [B2C](./B2C) if it's orientated to cryptocurrency investors.

For getting started for either of them, we need to have some common steps to follow.

## Fork/clone the Olympus project

Olympus Protocol is a fully open-sourced project, whose repository can be found here from [Github](https://github.com/Olympus-Labs/olympus-protocol).

You can start by forking the repository or simply clone it if you only want to try it out by running the command below. (Suppose git is already installed.)

> $ git clone https://github.com/Olympus-Labs/olympus-protocol.git

## Environment preparation

In order to start to work, we need to all the necessary support tools/libraries are installed in the system.

Node.JS and npm/yarn.

> https://nodejs.org/en/download/

Favorite IDE, we recommend Visual Studio Code aka vscode as the Olympus dev team is mostly using.

> https://code.visualstudio.com/

After the environment is ready, you can start installing the third-party dependencies by running the command below in the project root folder.

> $ npm install

or for yarn

> $ yarn

## Folder structure introduction

Once the project is cloned into local, you can open the project in vscode. Let's go through the structure to have a better understanding of the folders.

- docs: Where this tutorial that you are reading and other documentation is written.

- migrations: This folder contains an only file that helps us to create our contracts in the blockchain (local, Kovan, or mainnet). Setting the components and configuring them correctly.

- scripts: some javascript files we created to help the deployment/test process which can be ignored right now.

- tests: All the protocols are carefully tested and you are recommended to follow the same approach.

- contracts: where all solidity code is stored.
  - components: Core components that each of them acting independently for a different use.
  - interfaces: The abstracted layer for describing a higher level of the contracts.
  - olympusProtocols: Where all the templates and Olympus products ready to be edited and customized.
  - libs: Some basic solidity libraries for common purposes.

## Create your first derivate product template

To get yourself warmed up, the best way is always by doing of how to create and customize your own template with a basic example.

Firstly, create a new folder in contracts called myProtocols, copy the OlympusBasicFund.sol into it and rename it as MyBasicFund.sol

```
contracts
    olympusProtocols
        OlympusBasicFund.sol
    myProtocols
        MyBasicFund.sol
```

Olympus Basic Fund is a complete functional fund that can be actually directly deployed and used. However, the implementation is very basic which does not take in consideration of many scenarios.

Before starting to create our own customization let's first go through the process of how a fund is created on the blockchain from the technical perspective.

When a fund is being deployed to the blockchain, the constructor will be first called with parameters. They are the configurations specified by the fund manager.

```javascript
constructor( string _name, string _symbol, string _description, string_category,  uint _decimals) public
```

Then an initialization call will be done to connect this newly deployed fund the Olympus ComponentList and change the fund's status to active and make it open to the public.

```javascript
function initialize(address _componentList) external onlyOwner;
```

After that, there are some functions are prepared for outside to have some insights.

```javascript
function getTokens() external view returns(address[], uint[]); // return the underlying tokens
function tokensWithAmount() public view returns( ERC20Extended[] memory); // return the actual active tokens with amounts.
function getPrice() public view returns(uint); // get the unit price of a fund token
function getAssetsValue() public view returns (uint) // get the total fund value according to its underlying assets.
```

All derivatives must allow investors to invest and redeem. The basic logic is that when someone requests to redeem, the fund will first check if it has enough Ether otherwise it would start selling to fulfill the requests. For this reason, we have two helper functions guaranteeLiquidity (Make sure there is enough ETH to redeem), and getETHFromTokens (sell some tokens to get ETH back).

```javascript
function invest() public;
function withdraw() external returns(bool);
// Internal Withdraw functions
function getETHFromTokens(uint _tokenPercentage) internal;
function guaranteeLiquidity(uint tokenBalance) internal;
```

As the basic principle, the owner (Fund manager) should be able to trade tokens in the fund.

```javascript
function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates);
function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates);
function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success); // internal function to update the underlying tokens after each buy/sell operation
```

After all, if for whatever reason, the fund manager decides not to continue of this fund anymore, he can choose to close the fund and then it will start the closing procedures (sell all the underlying tokens and investors can redeem their belongings back in Ether).

```javascript
function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool);
function close() public onlyOwner returns(bool success);
```

For the complete documentation of the BasicFund, please refer to [OlympusBasicFund.sol](./OlympusBasicFund).

## Customize our template

Let’s suppose we are going to launch a new fund which only accepts the maximum 100 lucky investors. It will only accept new investors when the current holder quits when the maximum is reached.

First, create contract level variables for maximum investors and the current number of investors.

```javascript
mapping(address => bool) public activeTokens;
// Add this lines into the activeTokens
uint public max_investors;
uint public currentNumberOfInvestors;
```

`max_investors` will be a number selected on creation on the fund, that should not be changed later on. `currentNumberOfInvestors` is a counter that to keep track of the number of investors. (As we can not get a length of the mapping `activeInvestors`).

Then we can modify the initialize function.

```javascript
function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
       require(_componentList != 0x0);
       require(status == DerivativeStatus.New);
       require(_maxInvestors > 0); // New Line

/// Current code
// …
max_investors = _maxInvestors; // New Line
}
```

Here we have made three changes:

- Add `uint maxInvestors` parameters to the function
- Under the other checks, we added a check to make sure the \_maxInvestors value is higher than 0. (Otherwise no one would be able to invest!). The checks are done always on top of the actual execution in order to save investor's gas use as the best practice.
- At the end of the function, we added `max_investors = _maxInvestors;` that gives the contract level variable from the parameter from the function. We don’t require to initialize `currentNumberOfInvestors` as by default it is assigned to 0.

3. Now we need to keep track of the number of investors and check if it reaches the maximum when investing.

> balances[msg.sender] > 0 currentNumberOfInvestors < MAX_INVESTORS

We will allow you to invest either if you are a current investor ` balances[msg.sender] > 0 ` OR there is room for new investors `currentNumberOfInvestors < MAX_INVESTORS`

```javascript
function invest() public payable returns(bool) {
    require(status == DerivativeStatus.Active, "The Fund is not active");
    require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
    require(balances[msg.sender] > 0 currentNumberOfInvestors < MAX_INVESTORS, "Only limited number can invest"); // New line

    /// Current code

    if( balances[msg.sender] == 0) { // only increase the number of investors when this is a new investor
        currentNumberOfInvestors++;
    }

    balances[msg.sender] = balances[msg.sender].add(_investorShare); // SafeMath is used here to prevent overflow attack.
    totalSupply_ = totalSupply_.add(_investorShare);
    return true;
}
```

We also need to decrease the counter on redeem, allowing new investors when the old ones retire their position.

```javascript
   function withdraw() external returns(bool)  {
    // Rest of the code
       currentNumberOfInvestors--;
   }
```

In this basic implementation, the investor can only redeem all his investment at once. In the more complex situation, we need to decrease the counter when the balance becomes zero.

# Compile the new derivative

We have just made a new fund with new functions and now we need to get it ready for publishing. We have set some helper functions that you can find in our `packages.json` file.

To compile just run

> $ npm run build

or by yarn

> $ yarn build

If you have followed exactly the tutorial above you should not find any issues or warnings. Otherwise check carefully and fix the compiler messages.

After the command, you can find the compiled results in `/build/contracts` folder. Inside there you can find a JSON file with the same name which includes the ABI and binary code which can be used to direct deployment.

# Test the contract

Security is an important concern in the blockchain due to the fact that deployed code can't be upgraded and more importantly, we are dealing with investor's funds.

To cover the changes we've made, we need to:
_ Adding test cases.
_ Testing it on Kovan testnet.

## Adding test cases.

Several test cases has been already created for all our functionalities. You can run with the alias

> `npm run test`

that will test all the testcases. This is not optimum when creating test cases, we want to run only the test we are creating.
Run in one terminal the command

> './node_modules/.bin/testrpc-sc -l 1e8'

to start the ganache server. You will see that this server starts with 9 different accounts which hold ether. Then, in another terminal we can run

> truffle test

that will test all files, or specify test file.

> truffle test test/fund/TestBasicfund.js

Run the command and observe that all basic fund test cases are succeeding.

In order to create the test cases we dont need neither to start from zero. As we copied the `OlympusBasicFund.sol` we
are going to start from the basic. Copy the test file of `test/funds/TestBasicFund` to your own test folder `test/myTests`.

```
test
    funds
        TestBasicFund.sol <-- Copy this
    myTests
        TestMyBasicFund.sol  <-- In your own folder
```

We will customize the test to cover the new situations we have added.


 1. Import the correct fund Modify the initialize function

Despite we copied the fund test, the test is still utilizing the `OlympusBasicFund`.

```javascript
//Find this line
const Fund = artifacts.require("OlympusBasicFund");
// Replace for the name you gave to the fund
const Fund = artifacts.require("MyBasicFund");
```

We can change also the name of the test

```javascript
contract("My Basic Fund test", accounts => {
```

In the previous function we have modify the initialize function, if we now try to run test cases it will fail with an error

> Error: Invalid number of arguments to Solidity function

What is worst as the result of a test case affects the other test of the flow, all test will probably fail. (Don't panic down)
Lets add the default value, first add a line to the dummy data

```javascript
const fundData = {
  name: "OlympusBasicFund",
  symbol: "MBF",
  category: "Tests",
  description: "Sample of base fund",
  decimals: 18,
  maxInvestors: 2  // Add this line
};
```

Modify the create fund test.

```javascript
  it("Create a fund", async () => {
    // Find initialize line and add the parametter
    await fund.initialize(componentList.address, indexData.maxInvestors);

  });

```
There is a second test case checking that we can't initialize twice(it means it will revert the second time we call). But now will provide the Invalid number of arguments error, instead of a revert error.


```javascript
  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await fund.initialize(componentList.address, fundData.maxInvestors);
    }, "Shall revert");
  });
```

Now all tests are passing.

2. Add conditions to check number of investors.

We need to understand that the result of one test will affect the other one

>   it("Fund shall allow investment", async () => {

In this test we are investing twice (in the margin!)

>   it("Shall be able to request and withdraw", async () => {

  In the next test we are withdrawing twice. So the counter shall reduce and allow investment agian.

>  it("Shall be able to invest", async () => {

  In the final test we are investing again twice.
  So that mins the counter has being reseted.

  What is missing?
  - We need to add test to check the counter
  value is as expected.
  - We need to force the situation a third
  investor test and it will revert.

  Lets start checking in the create index test that
  the `MAX_INVESTORS` variable is initialize correctly.

```javascript

  assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));
  // Add this line below
  assert.equal((await fund.MAX_INVESTORS()).toNumber(), fundData.maxInvestors, 'Max Investors is correctly initialized');

```

`MAX_INVESTORS` is a public constant, solidity
creates automatically getters to the public function of the contract. The result is provided into javascript as `BigNumber` object, which is able to codify numbers much bigger than a number variable can store. But in order to compare we put it back `.toNumber()`.

Also realize that every time that we call a function in the fund we use the `await` key word. calling a function in the block chain is slow (in main net can take even minutes or hours). The result of the function will return a promise to be satisfy in the future. Using the command `await` we communicate that the function shall wait until the result is confirmed.

In the test "Shall be able to invest" lets renamed to "Shall be able to invest until maximum investors" and  add a
check for the counter.

```javascript
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 1);
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 2);
```

as well that gets reduced on withdraw

```javascript
  await fund.withdraw({ from: investorA });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 1);
```

```javascript
  await fund.withdraw({ from: investorB });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 0);
```

In the test cases are more investments and withdraws, but is enough to check it once.

2. Checking the special scenarios

Only two investors are allowed at the same time,
but we wanted to allow to a current investor keep investing.

In the test we invest 1 ETH, lets do it in two
parts, invest 0.5 ETH twice. (So will start withdraw 1 ETH at the end of the code)


```javascript

    // Invest allowed
    await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorA });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 1);
    await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorB });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 2);

    // Actual investors can invest again
    await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorB });
    assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 2);

```

The old investors can keep investing, but a new investorC shall not. We are going to use our own implementation of assertReverts (that requires await as is asynchronous, and accept and asynchronous function as parameter)

```javascript
    await calc.assertReverts(async () =>
      await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorC }),
      'Third investor can`t invest'
    );
```

When calling a function from test cases to solidity, we need to add the same name of arguments than required, plus we have and extra argument to allow to customize the call. Invest in ded requires 0 arguments plus the customization:

 > {from: address, value: valueInWei}

If from is not set, will be called by default from accounts[0], which in our test is the account that has created all components and derivatives.

Value serves us to set the ETH that the function will accept. Only payable function require value to have `a value` and the rest non payable will revert if value parameter is used.

Now our test is covering the main features of
our customized derivative. As a homewokr, you
can also verify that initialize with `MAX_INVESTORS` to zero will revert. As you can't initialize twice, you shall test it before the succesfull initialization.

Troublesome:
> TypeError: msg.replace is not a function

This exception is produced by a calc.assertReverts that it hasn't eventually reverted.

## Testing on Kovan using Remix.

Test cases are important but testing on testnet is also a must. We will use Remix for this which is online and free.

> https://remix.ethereum.org/

You need to assure you have metamask installed in your browser for Firefox or Chrome.

> https://metamask.io/

You can import your own testing account or create one within your metamask. After that you will need some testing ether that you can get in the faucet channel:

> https://gitter.im/kovan-testnet/faucet

Paste your wallet address and the bot will send to you some KETHs.

Once all the setup is done, we are ready to compile our contract and deploy in Kovan. First, you can run in the project command (set in package.json)

> $ npm run build-contracts

or by yarn

> $ yarn build-contracts

This creates the concatenated contracts in `/build/` folder which can be used in Remix directly. Copy the content of your file there and create a new file named ‘MyProduct.sol` in Remix (don’t forget the .sol termination, otherwise, remix won’t know how to compile it).

If the compilation of remix is successfully you can go to the run tab, and you will find all the list of contracts compiled in the current file. Choose the MyProduct in the list and click `create` or `deploy` to deploy to the selected network according to your metamask (Kovan testnet in this case).

Remix allows one single line input, separated by comas, or you can click in the arrow to fill input by input. After you submit remix will clear out your input, so we recommend to copy the "collapsed" in one line and copy in a notebook, will make your life easier to repeat the tests.

For example you can add this to deploy a index
> "Sample Fund","SFP","Testing fund","Funds","18"

After it's deployed, the contract will be showing at the bottom, by expanding it, you can execute the functions according to the flow we described above. The pink functions will create transactions that we need to approve in metamask, while the blue are view functions that will retrieve directly the storage value.

After that we will need to initialize the index

> "0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e", 5

The entry will use our olympus component list deployed in kovan and 5 as maximum investors.

Once the fund is initalized, we can invest. Invest requires no parameter but some ETH. Realize in the top of the right column there is information of the address you are using and also the value send to the contract. (You can select the unit ether or wei as you requires)

> For example, initalize 0.05 ETH in the fund.

A continuation you can use the view (blue) functions to check your balance of Fund Token, utilizing the address you invested as parameter.

You can check the counter of investors value and try to withdraw your tokens.

Other way to know the balance of your fund token
is to add the fund address to metamask. The derivative follows ERC20 standard and willa appear as one more of your collection.

Test the functions one by one and make sure they all pass before you release it.

Copy the address of your deployed testing derivative, it will remain in the chain forever!
Next time you want to use it, you can utilize the function contract at (the address of your contract) and the derivative will appear again in your remix. (For example, required if you reload the page).

## Trouble some in remix

> errored: Error encoding arguments: Error: invalid address (arg="", type="string", value="")

Your parameters are wrong, or you miss one
Addresses must start with 0x and be full address.
Array of addresses or long numbers shall enclose their value between "" ["address","address"].
bytes32 you can chose 0x0 for example.

> Out of gas on deployment:
The contract byte code is too big, you shall optimize the code and reduce the byte size to deploy. The maximum size allowed is determined by the blocks, at the time of this tutorial 7 million gas approximately.

> View (blue buttons) are not giving response.

Make sure that the file open in the editor is the same of the contract you are trying to check the view functions.

> All function suddenly reverts:

Reload remix.

> Metamask launch the transaction but it fails as out of gas:

Functions that use reimbursable require little more of gas than default proposed. Increase the amount manually in metamask.

> Revert:

Before metamask opens a error that transaction will appear will revert. 90% of the cases is true, 10% may still succeed the transaction, but that will be more special issue.

If you need to debug a revert try to:
 - Reproduce the issue in test cases first.
 - Check the view values (make all attributes of contract public), make manually step by step in a paper to find out what is the issue.
 - Copy the function is reverting and make copies of it (func2, func3, func4) connecting a line in each version. So you can figuerout which line and why is reverting.

Testing revert on remix can get tiresome if you have many steps before the issue happen, try to create shortcuts and simplify your code to make remix testing easier.

For more information on Remix, check the [Complete Manual](https://remix.readthedocs.io/en/latest/).
