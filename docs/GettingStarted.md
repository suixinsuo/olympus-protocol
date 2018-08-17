[TOC]

# Getting Started

Welcome to Olympus API, the cryptocurrency financial product protocol powering fintech DApp ecosystem. In this document, we are going to present you the Olympus protocols and the basic steps to get the development work on Olympus Platform started.

## Olympus Derivative Protocols

The technology of blockchain opens a gate to a lot of new distributed and secured cryptocurrencies that have become more popular. However, the nature of this world is still in a very early stage, with high rises and fallings of values. The market must maturate, part of the process of maturation is the creation of more complex and developed tools allowing investors to create security in their own assets.

Olympus Protocol is a set of protocols that support developers in creating financial products and alongside that also supports the process of doing so.

Olympus Protocols are based on three levels:

- The core components: Those can be utilized for making any customized financial derivative product much easier. The core is part of the Olympus environment and uses MOT ([Mountain Olympus Token](https://etherscan.io/token/0x263c618480dbe35c300d8d5ecda19bbb986acaed)) as an internal fuel for concrete transactions.

- Financial product templates: Those can be used as bases to create your own financial derivatives by connecting to different chosen core components and are already ready to deliver. It has different variations based on different use cases.

- The DApps: External applications (web/mobile apps) that use Olympus Protocols in different ways for any financial products.

We have separated this documentation into two parts; the first part, called [B2b](./B2B), is for creating portals/tools facing fund managers/organizations. The second part, called [B2C](./B2C), is orientated on cryptocurrency investors.

For getting started on either of them, there are some common steps to follow.

## Fork/clone the Olympus project

Olympus Protocol is a fully open-sourced project, whose repository can be found on [Github](https://github.com/Olympus-Labs/olympus-protocol).

You can start by forking the repository or, if you only want to try it out, by simply cloning it using the command below. (Git is a prerequisite for this command)

> $ git clone https://github.com/Olympus-Labs/olympus-protocol.git

## Environment preparation

In order to start to work, we need to have all the necessary supporting tools/libraries installed in the system.

Node.JS and npm/yarn.

> https://nodejs.org/en/download/

Your favorite IDE, we recommend Visual Studio Code aka VSCode as most of the Olympus development team is using this one.

> https://code.visualstudio.com/

After the environment is ready, you can start installing the third-party dependencies by running the command below in the project root folder.

> $ npm install

or for yarn

> $ yarn

## Folder structure introduction

Once you have cloned the project onto your own machine, you can open the project in VSCode. Let's go through the structure to have a better understanding of the folders.

- docs: Where this tutorial that you are reading and other documentation is written.

- migrations: This folder contains an only file that helps us to create our contracts in the blockchain (local, Kovan, or mainnet). Setting the components and configuring them correctly.

- scripts: Some Javascript files we created to help the deployment/test process; these can be ignored right now.

- tests: All the protocols are carefully tested and you are recommended to follow the same approach.

- contracts: Where all Solidity code is stored.
  - components: Core components, each of which has different functionalities.
  - interfaces: The abstracted layer for describing a higher level of the contracts.
  - olympusProtocols: Where all the templates and Olympus products are ready to be edited and customized.
  - libs: Some basic Solidity libraries for common purposes.

## Create your first derivate product template

To get yourself warmed up, we will walk you through creating and customizing your own template with a basic example.

Firstly, create a new folder in contracts called myProtocols, copy the OlympusBasicFund.sol into it and rename it as MyBasicFund.sol

```
contracts
    olympusProtocols
        OlympusBasicFund.sol
    myProtocols
        MyBasicFund.sol
```

Olympus Basic Fund is a completely functional fund that can directly be deployed and used. However, the implementation is very basic which does not account for many scenarios.

Before starting to create our own customization, let's first go through the process of how a fund is created on the blockchain from a technical perspective.

When a fund is being deployed to the blockchain, the constructor will be first called with parameters. They are the configurations specified by the fund manager.

```javascript
constructor(string _name, string _symbol, string _description, string_category,  uint _decimals) public
```

After the fund contract is deployed, an initialization call will be done to connect this newly deployed fund to the Olympus ComponentList and change the fund's status to active, allowing investors to start investing.

```javascript
function initialize(address _componentList) external onlyOwner;
```

After the initial configuration, there are some functions available which allow us to have some insight into the fund.

```javascript
function getTokens() external view returns(address[], uint[]); // return the underlying tokens
function tokensWithAmount() public view returns( ERC20Extended[] memory); // return the actual active tokens with amounts.
function getPrice() public view returns(uint); // get the unit price of a fund token
function getAssetsValue() public view returns (uint) // get the total fund value according to its underlying assets.
```

All derivatives must allow investors to invest and redeem. The basic logic is that when someone requests to redeem, the fund will first check if it has enough Ether otherwise it will start selling tokens in the fund to fulfill the requests. For this reason, we created two helper functions guaranteeLiquidity (Make sure there is enough ETH to redeem), and getETHFromTokens (sell some tokens to get ETH back).

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

If for whatever reason, the fund manager decides not to continue with this fund anymore, the manager can choose to close the fund, after which it will start the closing procedures (sell all the underlying tokens so that the investors can redeem their belongings back in Ether).

```javascript
function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool);
function close() public onlyOwner returns(bool success);
```

For the complete documentation of the BasicFund, please refer to [OlympusBasicFund.sol](./OlympusBasicFund).

## Customize our template

Let’s suppose we are going to launch a new fund which only accepts a maximum of 100 lucky investors. It will only accept new investors if a current holder quits when the maximum is reached.

First, create contract level variables for the maximum number of investors and the current number of investors.

```javascript
mapping(address => bool) public activeTokens;
// Add this lines into the activeTokens
uint public maxInvestors;
uint public currentNumberOfInvestors;
```

`maxInvestors` will be a number selected on creation on the fund, that should not be changed later on. `currentNumberOfInvestors` is a counter that keeps track of the number of investors. (As we can not get the length of the mapping `activeInvestors`).

After creating these initial variables, we can modify the initialize function.

```javascript
function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
        require(_maxInvestors > 0); // New Line

        /// Current code
        // …
        maxInvestors = _maxInvestors; // New Line
}
```

In this initialize function we have made three changes:

- Add the `uint _maxInvestors` parameter to the function.
- Under the other checks, we added a check to make sure the \_maxInvestors value is higher than 0. (Otherwise no one would be able to invest!). The checks should always be done at the top of the function in order to save investors' gas use, by preventing code execution if there is anything wrong.
- At the end of the function, we added `maxInvestors = _maxInvestors;`, this sets the contract level variable using the function parameter we added earlier. We don’t need to initialize `currentNumberOfInvestors` as by default it is assigned to 0.

Now we need to keep track of the number of investors and check if it reaches the maximum when investing.

> balances[msg.sender] > 0 currentNumberOfInvestors < maxInvestors

We will allow you to invest either if you are a current investor ` balances[msg.sender] > 0 ` OR if there is room for new investors `currentNumberOfInvestors < maxInvestors`

```javascript
function invest() public payable returns(bool) {
    require(status == DerivativeStatus.Active, "The Fund is not active");
    require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
    require(balances[msg.sender] > 0 currentNumberOfInvestors < maxInvestors, "Only limited number can invest"); // New line

    /// Current code

    if( balances[msg.sender] == 0) { // only increase the number of investors when this is a new investor
        currentNumberOfInvestors++;
    }

    balances[msg.sender] = balances[msg.sender].add(_investorShare); // SafeMath is used here to prevent overflow attack.
    totalSupply_ = totalSupply_.add(_investorShare);
    return true;
}
```

We also need to decrease the counter when redeeming, allowing new investors when the previous investors retire their position.

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

If you have followed the tutorial above exactly, you should not find any issues or warnings. Otherwise check carefully and fix the compiler messages.

After the command, you can find the compiled results in `/build/contracts` folder. Inside there you can find a JSON file with the same name which includes the ABI and binary code which can be used to deploy directly.

# Test the contract

Security is an important concern in the blockchain due to the fact that deployed code can't be modified and more importantly, we are dealing with investors' funds.

To cover the changes we've made, we need to:
_ Add test cases.
_ Test it on a testnet, for example, Kovan.

## Adding test cases.

We have already created several test cases for all our functionalities. You can run these test cases with the alias

> `npm run test`

This command will test all the test cases. This is not optimal when creating test cases, we want to run only the test we are creating.
Run in one terminal the command

>$ './node_modules/.bin/testrpc-sc'

to start the ganache server. You will see that this server starts with 9 different accounts which hold Ethers. Then, in another terminal, we can run

>$ truffle test

that will test all files, or to specify a single test file:

> truffle test ./test/fund/TestBasicfund.js

Run the command and observe that all basic fund test cases are succeeding.

To create the test case, we don't need to start from zero. As we copied the `OlympusBasicFund.sol` we
are going to start from the basic. Copy the test file of `test/funds/TestBasicFund.js` to your own test folder `test/myTests`.

```
test
    funds
        TestBasicFund.js <-- Copy this
    myTests
        TestMyBasicFund.js  <-- In your own folder
```

We will customize the test to cover the new situations we have added.


 1. Import the correct fund and modify the initialize function

After we copied the test, it is still utilizing the `OlympusBasicFund`.

```javascript
//Find this line
const Fund = artifacts.require("OlympusBasicFund");
// Replace for the name you gave to the fund
const Fund = artifacts.require("MyBasicFund");
```

We can change the name of the test as well.

```javascript
contract("My Basic Fund test", accounts => {
```

In the previous function we modified the initialize function, if we try to run the test case now, it will fail with an error.

> Error: Invalid number of arguments to Solidity function

The worst part of a failing test is that the result of a test case affects the other test of the flow, so all tests will probably fail (don't panic).
Let's add the default value first by adding a line to the dummy data

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

Modify the test of creating the fund.

```javascript
  it("Create a fund", async () => {
    // Find initialize line and add the parameter
    await fund.initialize(componentList.address, indexData.maxInvestors);

  });

```
There is a second test case checking that we can't initialize twice (meaning that the transaction will revert when we call initialize for the second time). But now the transaction will return the Invalid number of arguments error, instead of a revert error.


```javascript
  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await fund.initialize(componentList.address, fundData.maxInvestors);
    }, "Shall revert");
  });
```

After changing this test as well, all tests are passing.

2. Add conditions to check the number of investors.

We need to understand that the result of one test will affect the following tests.

>   it("Fund shall allow investment", async () => {

In this test, we are investing twice (within the margin!).

>   it("Shall be able to request and withdraw", async () => {

In the next test, we are withdrawing twice. So the counter shall reduce and allow investment again.

>  it("Shall be able to invest", async () => {

In the final test, we are investing twice again.
This means the counter has reset.

What is missing?
- We need to add a test to check whether or not the value of the counter for the number of investors is as expected.
- We need to force a situation, using a third investor to invest, and the transaction should revert.

Let's start checking in the create index test that
the `maxInvestors` variable is initialized correctly.

```javascript

assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));
// Add this line below
assert.equal((await fund.maxInvestors()).toNumber(), fundData.maxInvestors, 'Max Investors is correctly initialized');

```

`maxInvestors` is a public  variable, solidity
automatically creates getters to the public variables of the contract. The result is provided in javascript as `[BigNumber](https://github.com/MikeMcl/bignumber.js/)` object. In order to compare we need to put it back `.toNumber()`.

Also important to know is that every time that we call a function in the fund we use the `await` keyword. Calling a function in the blockchain is slow (in the main Ethereum network it can take even minutes or hours). The result of the function will return a promise to be satisfied in the future. Using the command `await` we communicate that the function shall wait until the result is confirmed.

Let's rename the test "Shall be able to invest" to "Shall be able to invest until maximum investors" and add a check for the currentNumberOfInvestors counter.

```javascript
await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 1);
await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });
assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 2);
```

Add a check as well that the counter gets reduced on withdrawing.

```javascript
await fund.withdraw({ from: investorA });
assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 1);
```

```javascript
await fund.withdraw({ from: investorB });
assert.equal((await fund.currentNumberOfInvestors()).toNumber(), 0);
```

In the test cases, there are more investments and withdrawals, but it is enough to check the counter only once.

2. Checking the special scenarios

Only two investors are allowed at the same time, but we wanted to allow current investors to keep investing.

In the test above we invested 1 ETH, lets split it into two
parts, investing 0.5 ETH twice. (So will start withdrawing 1 ETH at the end of the code)


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

The active investors can keep investing, but a new, third investor, investorC can not. We are going to use our own implementation of assertReverts (that requires await is asynchronous, and accepts an asynchronous function as the parameter)

```javascript
await calc.assertReverts(async () =>
    await fund.invest({ value: web3.toWei(0.5, "ether"), from: investorC }),
    'Third investor can`t invest'
);
```

When calling a function from test cases to solidity, we need to add the same number of arguments as required, plus we have an extra argument to allow to customize the transaction. Invest requires 0 arguments plus the customization:

 > {from: address, value: valueInWei}

If from is not set, will be called by default from accounts[0], which in our test is the account that has created all components and derivatives.

Value serves us to set the ETH that the function will accept. Only payable functions require the value field to have `a value`. Non-payable functions will revert if value parameter is used.

Now our test is covering the main features of our customized derivative. As homework, you can also verify that initialize with `maxInvestors` to zero will revert. As you can't initialize twice, you need to test it before the successful initialization.

Troublesome:
> TypeError: msg.replace is not a function

This exception is produced by a calc.assertReverts that it hasn't eventually reverted.

## Testing on Kovan using Remix.

Test cases are important but testing on testnet is also a must. We will use Remix for this which is online and free.

> https://remix.ethereum.org/

You need to be sure that you have metamask installed in your browser for Firefox or Chrome.

> https://metamask.io/

You can import your own testing account or create one within your metamask. After that you will need some testing ether that you can either get in the faucet gitter channel or the faucet of the Kovan network from Parity:

> https://gitter.im/kovan-testnet/faucet
> https://faucet.kovan.network/

Paste your wallet address and the bot will send to you some KETHs.

Once all the setup is done, we are ready to compile our contract and deploy in Kovan. First, you can run in the project command (set in package.json)

> $ npm run build-contracts

or by yarn

> $ yarn build-contracts

This creates the concatenated contracts in `/build/` folder which can be used in Remix directly. Copy the content of your file there and create a new file named ‘MyProduct.sol` in Remix (don’t forget the .sol termination, otherwise, Remix won’t know how to compile it).

If the compilation of Remix is successfully you can go to the run tab, and you will find all the list of contracts compiled in the current file. Choose the MyProduct in the list and click `create` or `deploy` to deploy to the selected network according to your metamask (Kovan testnet in this case).

Remix allows one single line input, separated by commas, or you can click on the arrow to fill input by input. After you submit remix will clear out your input, so we recommend to copy the "collapsed" in one line and copy it to somewhere, making it easier to repeat the tests.

For example, you can add these parameters to deploy an index.
> "Sample Fund","SFP","Testing fund","Funds","18"

After it's deployed, the contract will be showing at the bottom right. By expanding it, you can execute the functions according to the flow we described above. The pink functions will create transactions that we need to approve in metamask, while the blue are view functions that will directly retrieve the storage value.

After deploying, we need to initialize the index.

> "0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e", 5

The entry will use our Olympus component list deployed in kovan and 5 as maximum investors.

Once the fund is initialized, we can invest. Invest requires no parameter but does require some ETH. In the top of the right column, there is information of the address you are using and also the value to send to the contract. (You can select the unit ether or wei, whichever you prefer)

> For example, invest 0.05 ETH in the fund.

To continue, you can use the view (blue) functions to check your balance (balanceOf) of Fund Tokens, utilizing the address of the account you used to invest as the parameter.

You can check the counter of investors value and try to withdraw your tokens.

Another way to know the balance of your fund token
is to add the fund address to metamask. The derivative follows the ERC20 standard and will appear as one more of your collection.

Test the functions one by one and make sure they all pass before you release it.

Copy the address of your deployed testing derivative, it will remain in the chain forever!
Next time you want to use it, you can utilize the Remix function "At Address" (the address of your contract) and the derivative will appear in the bottom right of your Remix again. (For example, required if you reload the page).

## Troublesome in Remix

> errored: Error encoding arguments: Error: invalid address (arg="", type="string", value="")

Your parameters are wrong, or you miss one
An address must start with 0x and be a full valid address.
An array of addresses or long numbers shall enclose their value between "" ["address","address"].
bytes32 you can choose 0x0 for example.

> Out of gas on deployment:
The contract bytecode is too big, you need to optimize the code and reduce the byte size to deploy. The maximum size allowed is determined by the blocks, at the time of this tutorial 7 million gas approximately. Be sure to check if optimization is enabled on the settings tab of Remix.

> View (blue buttons) are not giving a response.

Make sure that the file open in the editor is the same as the contract of which you are trying to check the view functions.

> All function suddenly reverts:

Reload remix.

> Metamask launch the transaction but it fails as out of gas:

Some functions that use certain components such as the Reimbursable component require more gas than the default estimation. Increase the amount manually in metamask (~10-25% should be enough).

> Revert:

Before metamask opens, an error that the transaction will revert will appear. 90% of the cases this is a correct estimation, but 10% of the time the transaction may still succeed. That will be a more special issue.

If you need to debug a reverting transaction try to:
 - Reproduce the issue in unit test cases first.
 - Check the view values (make all attributes of contract public), manually make the calculation step by step on a paper to find out what the issue is.
 - Copy the function which is reverting and make copies of it (func2, func3, func4) connecting a line in each version. So you can figure out which line of code is reverting and why.

Testing revert on remix can get tiresome if you have many steps before the issue happen, try to create shortcuts and simplify your code to make remix testing easier.

For more information on Remix, check the [Complete Manual](https://remix.readthedocs.io/en/latest/).


## After this tutorial

- You can find all the files of this tutorial as part of the repository, with the name of OlympusTutorialFund.

- You can continue reading the ABI documentation.

- You can try to add new features to your fund:
  a) Select how much a user wants to withdraw.
  b) Implement the whitelist component to allow only certain users to invest.
  c) Add new features to the OlympusBasicIndex.
  d) Take a look at our complete and real derivative implementations.
