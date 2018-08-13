# Getting Started

Welcome to Olympus API, in this document we are going to present to you Olympus Derivatives and the basic steps to work with them.

## Olympus Derivatives

The technology of blockchain open the gate to a lot of new distributed and secured cryptocurrencies that start to become each time more and more popular, creating a new financial ecosystem. However, the nature of this cryptoworld is not reliable, with highest rises and fallings of values, common for a not mature ecosystem.

The market must madurate, part of the process of maturation is the creation of more complex and developed tools that allow investors to create security in their own assets. This new financials productos already start to appear in the market, however, there is big diversity of possibilities to be developed, and each investor has his own needs.

That's the point Olympus will support you, Olympus is not just a proposal of financial products, but the knowhow, the templates, the tools and the support to allow you to become a solidity developer and create your own financial products.

Olympus project is based on a three levels:
 a) The core: a set of helpful components that can be utilize for any financial product making much easier to customize your own derivative. The core works under Olympus environment and use MOT (Mont Olympus Token) as a internal currency for concrete transactions.

 b) Financial products: Different templates, from basic empty templates ready for customization to complete financial products where you can do a modification and are ready to deliver.

 c) The DAPPS: External applications (webs, apps) that use in a different way our protocol and financial products. We will also provide you the tools to connect externally to the protocol as well as your own financial products.


## 2. How to fork/clone the project.

We can start cloning Olympos Protocol Template. from the [Olympus repository](https://github.com/Olympus-Labs/olympus-protocol)

IMAGE HERE

We just need to fork the project, that will make a copy of the project in your own repository, where you can edit and track your on progress. Later on even you can contribute your code into the main Olympus repository.

Now we need to clone the repository in our own computer. Clicking in
clone the repository, we will get provide with the repository URL.

For example, that's the URL of my own for.

> https://github.com/abelbordonado/olympus-protocol.git

In order to start to work we need to make sure some tools are installed in our system.

First Install Node and NPM
> https://www.npmjs.com/get-npm

Install your favourite GIT tool:
> https://git-scm.com/downloads
For simplicity, al git commands we will execute following git in terminal.

Second, we recommend Code Visual Studio as the editor the team of Olympus is mostly using.
> https://code.visualstudio.com/


Finally download the repository from your editor or on a terminal
`git clone https://github.com/abelbordonado/olympus-protocol.git`

## 3. Folder structure introduction.

Once the project is clone in local, you can open the folder and you will find next structure. Now it may feel overwhelming to understand each single file, just try to get and overview of the files and later one we will refer again to them though the tutorial.

- Docs: Where this tutorial that you are reading and other documentation being written.

- Migrations: This folder contains a only file that help us to create our contracts in the block chain (local, kovan, or mainnet). Setting the components and configuring them correctly.

- Scripts: ????

- Tests: All the products are carefully tested and you are recommended to follow same as carefully. We will explain how to in the next sections.

- Contracts: Contracts is where all solidity code is stored.
 + Interfaces: Describes the communication layer between contracts.
 + Olympus Protocols: Where you will find all the templates and olympus products ready to be edited and customized.
 + Libs: Some basic solidity libraries for common purpose.
 + Component Containers: ** TO CREATE ** Contracts that hold our products and components get listed in the blockchain.
 + Components: In components you will find all the modules that compose the core of Olympus protocol, the base contracts
 that are inherited by the templates and all the list of provider that contains our ecosystem.


## 4. Create your first template.

In order to get introduce to the project the best is make small work around how to create and customize your own template with a basic example.

Create first a new folder in contracts/ call myProtocols, copy the OlympusBasicFund.sol into it and rename it as MyBasicFund.sol

````
Contracts
OlympusProtocols
		> OlympusBasicFund.sol
MyProtocols
> MyBasicFund.sol
````

Olympys basic Fund is a complete functional fund that can be directly updated and used in the blockchain. However, the implementation is really basic not taking in account many scenarios.

Before starting to create our own costumization lets take a look to the content of the file:

Creating the fund flow: Or our derivatives have the next creation flow, on the constructor we add the basic information of the fund, and after we initialize them with all component requires and other configuration values.

````
constructor( string _name, string _symbol, string _description, string_category,     uint _decimals) public

  	function initialize(address _componentList) external onlyOwner
````
Initialize will set the status to active and open to the public.

   b) Basic getters: Get tokens will return the fund tokens. Get tokens with amount only those whose have actual amount. While updateTokens is a internal function to update the tokens on the index after every buy/sell operation.

````
   function getTokens() external view returns(address[], uint[])
   function tokensWithAmount() public view returns( ERC20Extended[] memory)
   function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success)
````

c) All derivatives must allow investor to invest and withdraw. If all assets of the fund are based on derivatives, when withdrawing the fund will sell some of his tokens, for this reason we have two helper functions guarantee Liquidity (Make sure there is enough ETH for withdraw), and getETHFromTokens (sell some tokens to get ETH back). We don't enter into the withdraw cycle in this example.

````
   function invest() public
   function withdraw() external returns(bool)
   // Internal Withdraw functions
   function getETHFromTokens(uint _tokenPercentage) internal
   function guaranteeLiquidity(uint tokenBalance) internal
````

d) The value of the Derivative is based in his actual ETH, and the value of his underlying values.

````
function getPrice() public view returns(uint)
function getAssetsValue() public view returns (uint)
````

e) Our derivatives allow to change the status and close them. (Close will sell using same getETHFromTokens all his assets values for ETH, blocking all the operations except the withdraw for the investors.

````
function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool)
function close() public onlyOwner returns(bool success)
````

f) And finally, as a Fund requirement, the owner ot the fund can buy and sell tokens.

```
   function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
   function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
```
Attention: Realize that `OlympusBasicFund` is inheriting `BaseDerivative` which exposes other interesting functions as manage the fund components.

Now you have a main idea of all the content from, the template. You can get a full understanding of each functionality in the (BasicFund API Documentation)[http://broken] as well as other derivative template.

## 6. Customize our template

Let’s suppose we are going to launch a campaign for our fund, and we only want to accept `MAX_INVESTORS = 100`, 100 investors at the same time, urging our customers to invest fast.

We create the new variables
````
mapping(address => bool) public activeTokens;
// Add this lines into the activeTokens
uint public MAX_INVESTORS;
uint public currentNumberOfInvestors;
```

`MAX_INVESTORS` will be a number selected on creation on the fund, that can’t be changed later on. While `currentNumberOfInvestors` is a counter that we use to keep track of the investors. (As we can not get a length of the mapping `activeInvestors`).

2) We modify the initialize function.

``
function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
       require(_componentList != 0x0);
       require(status == DerivativeStatus.New);
       require(_maxInvestors > 0); // New Line

/// Current code
// …

MAX_INVESTORS = _maxInvestors; // New Line

}
```
Realize we have made 3 changes:
Add `uint maxInvestors` parametters to the function
Under the other requires, we have add a check to make sure the _maxInvestors value is higher than 0. (Otherwise no one would be able to invest!). Require functions are done in the code, so in case they fail, they fail as soon as possible utilizing the less gas possible.
Finally, at the end of our code, we have added `MAX_INVESTORS = _maxInvestors; ` that initialices the variable. We don’t require to initialize `currentNumberOfInvestors` as by default is assigend to 0.


3) We keep a track of the number of investors. Not allowing to invest if the maximum is reached.

````
   function invest() public payable returns(bool) {
 require(status == DerivativeStatus.Active, "The Fund is not active");
       require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
       require(currentNumberOfInvestors < MAX_INVESTORS, "Only limited number can invest"); // New line

/// Current code

if( balances[msg.sender] == 0) {
           currentNumberOfInvestors++;
       }

       balances[msg.sender] = balances[msg.sender].add(_investorShare);
       totalSupply_ = totalSupply_.add(_investorShare);
       return true;

}
````

In first instance we add a new require (also at the starting of the function), to avoid more than `MAX_INVESTORS` to invest.
If the investor didn't have any balance previously it means we are in front of a new investor, and we increment the counter. We only allow MAX_INVESTORS to invest, but a current investor can keep investing amount if he desired. (Otherwise we will be allowing only 100 investments, not 100 investors.

4) We reduce the counter on withdraw, allowing new investors when the old ones retire their position.
```
   function withdraw() external returns(bool)  {
	// Rest of the code
       currentNumberOfInvestors--;
   }
```
At the end of the function we reduce the counter. In this basic withdraw implementation the investor withdraws all his investment at once. If the investor can choose how much quantity he can withdraw, we can check to only reduce the counter when the balance of the investor becomes 0.


## 7. Using Olympus components.

Olympus offer a great variety of components that allow us to increase the capability of the fund with only a few lines.  In this scenario we want to give some guarantee to our investors that his money is not going to be wasted in buy/sell transactions by the owner. We will allow the owner only to make operations on a concrete token once every 1 week.

In order to accomplish that, we need a set of new variables and logics, hopefully, we can also use the interface `LockerContainer` that will allow us to create any kind of timers in our fund. You can check [LockerProvider ABI] (http://broken-link) in the documentation.



We import the Locker interface
```
import "../../interfaces/LockerInterface.sol";
```
Make sure we import the interface in the top of the contract, together the other imports.

We create component identifier.
```
   bytes32 public constant LOCKER = "LockerProvider";
   uint public constant OPERATION_DELAY = 7 days;

```
We create a constant that will represent the locker component in our component list. Every derivative extends from `ComponentList`  base class (in `contracts/components/base` folder. This class allow us to storate any kind of provider (Olympus or your own components set). This key LockerProvider is they name in which the component is identified on our component list.
Realize we set bytes32 instead of string. In the code both looks the same but in solidity bytes32 utilize much less memory making a big difference of gas while deploying the contract. (As our team experienced in the code optimization phases).
We set a constant of 7 days between operations.

We initialize the component
````
  function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
     	 // REST CODE

       super._initialize(_componentList);
	// We just add LOCKER to the array.
       bytes32[4] memory names = [MARKET, EXCHANGE, WITHDRAW, LOCKER];

       for (uint i = 0; i < names.length; i++) {
           // updated component and approve MOT for charging fees
           updateComponent(names[i]);
       }


        // REST OF CODE
   }
	````
We don’t need a new parametters to set the component. Realize that initialize takes `ComponentList` address as parametter. You shall utilize the active Olympus Component List, then you have inmediately access to all our components, including the capability to update to the latests version once your fund is published.
We add LOCKER to the name list (and increase the size of the list to 4). LOCKER already contains the same name that Locker component holds in our component list, so will be automatically selected.
updateComponent inside the loop will chose the latest version of the LockerProvider as well as approve this component to take MOT from the fund. Most of components of our providers are fee, but some of them may have a fee charge in MOT. For this reason, is important to encourage to the owner to keep certain quantity of MOT in his fund.

````

Initialize locker

In this case, we don’t have a unique interval, but a interval for each token. We need to initialize each interval the first time a new token is added into the fund. No worries, that logic is already present:
````

 function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success) {
       ERC20 _tokenAddress;
       LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

       for (uint i = 0; i < _updatedTokens.length; i++) {
           _tokenAddress = _updatedTokens[i];
           amounts[_tokenAddress] = _tokenAddress.balanceOf(this);
           if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress]) {
               tokens.push(_tokenAddress);
               activeTokens[_tokenAddress] = true;
               lockerProvider.setTimeInterval(bytes32(address(_tokenAddress)),TRADE_INTERVAL);
               continue;
           }
           emit TokenUpdated(_tokenAddress, amounts[_tokenAddress]);
       }
       return true;
   }
```
LockerProvider is in our component list, we get the component by the name we provided and cast to the address to the locker interface, so solidity can understand how we want to utilize it.
In the case that a token is new `if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress])` we add the line to initialize the timer.
Calling setTimeInterval we initialize the the timer to 7 days value stored in TRADE_INTERVAL variable. Realize that we need a name to identify the interval itself, for that we use the same address of the ERC20 token (getting the address and casting it to bytes32 will make the job).


4) We check the interval before buy a token.

```
function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
        public onlyOwner returns(bool) {

       // Get the component
       LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

        // Check we have the ethAmount required
       uint totalEthRequired = 0;
       for (uint i = 0; i < _amounts.length; i++) {
  	     // Utilize same loop to check the interval
            lockerProvider.checkLockerByTime(bytes32(address(_tokens[i])));

           totalEthRequired = totalEthRequired.add(_amounts[i]);
       }
       require(address(this).balance >= totalEthRequired);

       require(
           OlympusExchangeInterface(getComponentByName(EXCHANGE))
           .buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId)
       );
	// Update tokens will initialize the new tokens
       updateTokens(_tokens);
       return true;
}
````
We get in the same way our lockerProvider.
Buy tokens is checking the total amount of ETH required to buy all the tokens. We take advantage of this loop and also check the interval (avoiding to create a second loop).
In case is the first time we buy a token, the current value of the interval will be 0. (So will be purchased). After that updateTokens will initialize the interval to 7 days. Second time we buy with this token the interval will apply.
There is a small issue, the interval won’t apply til the second purchase. You can think how to apply the interval from the first moment in a optimum way as a challenge.

5) Add the interval check in sell tokens
function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
     public onlyOwner returns (bool) {

       LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));
       OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

       for (uint i = 0; i < tokens.length; i++) {
   lockerProvider.checkLockerByTime(bytes32(address(_tokens[i])));

           ERC20NoReturn(_tokens[i]).approve(exchange, 0);
           ERC20NoReturn(_tokens[i]).approve(exchange, _amounts[i]);

       }

       require(exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId));
       updateTokens(_tokens);
       return true;

}
Similar code as before, we get the component, and in the same loop we are giving approval to the exchange provider to exchange the token, we check the locker provider.
If the timer is not initialize will be initialize while using updateTokens internal function.
Remember the checkInterval will revert if any of the tokens delay hasn’t pass, reverting the full selling transaction.


# 8. Compile the new derivative.

Now that our component is fully customized we can compile it. We have set some helper functions that you can find in our `packages.json` file.

To compile just run

`npm run build`

If you have follow the tutorial correctly you won’t find any issue or warning. Otherwise check carefully and fix the compiler messages.

Finally will appear in our code structure a /build/contracts folder. Inisde you can locate the fund you have created with all the information in a .json format, including the ABI and binary code required to connect to it.

# 9. Test the contract

Security is an important concern in blockchain, and being error 0 a huge requirement, once our product is deployed can’t be updated.


#9. Testing in KOVAN using remix.

Test cases are important, but also is recommended to test our product into the testing block chain. We will use the tool of Remix which is online and free.

> https://remix.ethereum.org/

You need to assure you have metamask plugin in your browser.

> https://metamask.io/

You can import your own testing account or create one within your metamask. After that you will need some testing ether that you can get in the faucet channel:

> https://gitter.im/kovan-testnet/faucet

Paste your wallet address and the bot will send to you the required ether amount.

Once all the setup is done, we are ready to compile our contract and deploy in kovan. First you can run in the project command (set in package.json)

`npm run build-contracts`

This will create in `/build/` folder all the contracts of the project ready for deployment. Find the product you have created and open it. You will find out that build-contracts have mix all the imports into the same file of the contract. In that way, solidity has all required information to deploy the contract.

Copy the content of the file and in remix create a new file named ‘MyProduct.sol` (don’t forget the .sol termination, otherwise remix won’t know how to compile it).
If the compilation of remix is successfull you can go to the run tab, and you will find all the list of products compiled in the current file. We are only interested in our final derivative.

Select the derivative on the list,

…..

