# Getting Started

Welcome to Olympus API, the cryptocurrency financial product protocol powering fintech DApp ecosystem. In this document we are going to present you the Olympus protocols and the basic steps get the development work on Olympus Platform started.

## Olympus Derivative Protocols

The technology of blockchain opens a gate to a lot of new distributed and secured cryptocurrencies that has become more popular. However, the nature of this cryptoworld is still in the very beginning stage, with high rises and fallings of values. The market must maturate, part of the process of maturation is the creation of more complex and developed tools allowing investors to create security in their own assets.

Olympus Protocols is a set of protocols that allow developers to connect to it to provide support of financial products creation and alongside the support of the process.

Olympus Protocols are based on three levels:

- The core components: Those can be utilized for making any customized financial derivative product much easier. The core works in Olympus environment and uses MOT ([Moutain Olympus Token](https://etherscan.io/token/0x263c618480dbe35c300d8d5ecda19bbb986acaed)) as an internal currency for concrete transactions.

- Financial product templates: Those can be used as bases to create your own financial derivatives by connecting to different chosen core components and are already ready to deliver. It has different variations according to different use cases.

- The DApps: External applications (web/mobile apps) that use Olympus Protocols in different ways for any financial products.

In this documentation, we try to separate to two parts, for creating portals/tools facing to fund managers/organizations, we call it [B2B](./B2B). And we call it [B2C](./B2C) if it's orientated to cryptocurrency investors.

For getting started for either of them, we need to have some common steps to follow.

## Fork/clone the Olympus project.

Olympus Protocol is a fullly open-sourced project, whose repository can be found here from [Github](https://github.com/Olympus-Labs/olympus-protocol).

You can start by forking the repository or simply clone it if you only want to try it out by running the command below. (Suppose git is already installed.)

> $ git clone https://github.com/Olympus-Labs/olympus-protocol.git

## Environment preparation.

In order to start to work we need to all the neccessary support tools/libraries are installed in the system.

Node.JS and npm/yarn.

> https://nodejs.org/en/download/

Favorite IDE, we recommend Visual Studio Code aka vscode as the Olympus dev team is mostly using.

> https://code.visualstudio.com/

After the environment is ready, you can start installing the thred-party dependencies by running the command below in the project root folder.

> $ npm install

or for yarn

> $ yarn

## Folder structure introduction.

Once the project is cloned into local, you can open the project in vscode. Let's go through the structure to have a better understanding of the folders.

- docs: Where this tutorial that you are reading and other documentation being written.

- migrations: This folder contains a only file that help us to create our contracts in the blockchain (local, kovan, or mainnet). Setting the components and configuring them correctly.

- scripts: some javascript files we created to help the deployment/test process which can be ignored right now.

- tests: All the protocols are carefully tested and you are recommended to follow them same approach.

- contracts: where all solidity code is stored.
  - components: Core components that each of them acting independently for a different use.
  - interfaces: The abstracted layer for describing higher level of the contracts.
  - olympusProtocols: Where all the templates and olympus products ready to be edited and customized.
  - libs: Some basic solidity libraries for common purposes.

## Create your first derivate product template.

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

Then an initlaization call will be done to connect this newly deployed fund the Olympus ComponentList and change the fund's status to active and make it open to the public.

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

All derivatives must allow investors to invest and redeem. The basic logic is that when someone requests to redeem, the fund will first check if it has enough Ether otherwise it would start selling to fullfil the requests. For this reason we have two helper functions guaranteeLiquidity (Make sure there is enough ETH for redeem), and getETHFromTokens (sell some tokens to get ETH back).

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

After all, if for whatever reason, the fund manager decides not to continue of this fund any more, he can choose to close the fund and then it will start the closing procedures (sell all the underlying tokens and investors can redeem their belongings back in Ether).

```javascript
function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool);
function close() public onlyOwner returns(bool success);
```

For the complete documentation of the BasicFund, please refer to [OlympusBasicFund.sol](./OlympusBasicFund).

## Customize our template.

Let’s suppose we are going to launch a new fund which only accepts the maximum 100 lucky investors. It will only accept new investors when the current holder quits it it reaches the maximum.

First create contract level variables for maximum investors and current number of investors.

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
- At the end of the function, we added `max_investors = _maxInvestors;` that gives the contract level variable from the parameter from the function. We don’t require to initialize `currentNumberOfInvestors` as by default it is assigend to 0.

3. Now we need to keep track of the number of investors and check if it reaches the maximum when investing.

```javascript
function invest() public payable returns(bool) {
    require(status == DerivativeStatus.Active, "The Fund is not active");
    require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
    require(currentNumberOfInvestors < max_investors, "Only limited number can invest"); // New line

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

In this basic implementation the investor can only redeem all his investment at once. In the more complex situation, we need to decrease the counter when the balance becomes zero.

# Compile the new derivative.

We have just made a new fund with new functions and now we need to get it ready for publishing. We have set some helper functions that you can find in our `packages.json` file.

To compile just run

> $ npm run build

or by yarn

> $ yarn build

If you have followed exactly the tutorial above you should not find any issues or warnings. Otherwise check carefully and fix the compiler messages.

After the command, you can find the complied results in `/build/contracts` folder. Inisde there you can find a json file with the same name which includs the ABI and binary code which can be used to direct deployment.

# Test the contract

Security is an important concern in the blockchain due to the fact that deployed code can't be upgraded and more importantly, we are dealing with investor's funds.

To cover the changes we've made, we need to:
_ Adding test cases.
_ Testing it on kovan testnet.

### Adding test cases.

### Testing on Kovan using Remix.

Test cases are important but testing on testnet is also a must. We will use Remix for this which is online and free.

> https://remix.ethereum.org/

You need to assure you have metamask installed in your browser for Firefox or Chrome.

> https://metamask.io/

You can import your own testing account or create one within your metamask. After that you will need some testing ether that you can get in the faucet channel:

> https://gitter.im/kovan-testnet/faucet

Paste your wallet address and the bot will send to you some KETHs.

Once all the setup is done, we are ready to compile our contract and deploy in kovan. First you can run in the project command (set in package.json)

> $ npm run build-contracts

or by yarn

> $ yarn build-contracts

This creates the concanated contracts in `/build/` folder which can be used in Remix directly. Copy the content of your file there and create a new file named ‘MyProduct.sol` in Remix (don’t forget the .sol termination, otherwise remix won’t know how to compile it).

If the compilation of remix is successfull you can go to the run tab, and you will find all the list of contracts compiled in the current file. Choose the MyProduct in the list and click `create` or `deploy` to deploy to the selected network according to your metamask (Kovan testnet in this case).

After it's deployed, the contract will be showing at the bottom, by expanding it, you can execute the functions according to the flow we described above. Test the functions one by one and make sure the all pass before you release it.

For more information of Remix, check the [Complete Manual](https://remix.readthedocs.io/en/latest/).
