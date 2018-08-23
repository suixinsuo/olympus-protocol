## Using Olympus components.

[This is the second part of GetStarted tutorial. We use the same files as in the first part of the tutorial to demonstrate using Olympus components]

Olympus offers a great variety of components that allows us to increase the capability of any fund with only a few lines. In this scenario we want to give some guarantee to our investors that their money is not going to be wasted in buy/sell transactions by the owner. We will allow the owner to only make operations on a concrete token once per week.

In order to accomplish that, we need a set of new variables and logic. We can also use the interface `LockerContainer` that will allow us to create any kind of timers in our fund. You can check the [LockerProvider ABI](http://broken-link) in the documentation.

1. We import the Locker interface

```
import "../../interfaces/LockerInterface.sol";
```

Make sure we import the interface at the top of the contract, together with the other imports.

2. We create the component identifier.

```javascript
    bytes32 public constant LOCKER = "LockerProvider";
    uint public OPERATION_DELAY = 7 days;
```

We create a constant that will represent the locker component in our component list. Every derivative extends from `ComponentList` base class (in `contracts/components/base` folder. This class allow us to store any kind of provider (Olympus or your own component set). This key LockerProvider is they name in which the component is identified on our component list.
Take note that we use bytes32 instead of string. In the code both look the same but in solidity bytes32 utilizes much less memory making a significant difference of gas usage while deploying the contract. (As our team experienced in the code optimization phases).
We set a constant of 7 days between operations.

3. We initialize the component

```javascript
  function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
      // REST OF CODE

      super._initialize(_componentList);
      // We just add LOCKER to the array.
      bytes32[4] memory names = [MARKET, EXCHANGE, WITHDRAW, LOCKER];
      excludedComponents.push(LOCKER); // Add this line, because the Locker component doesn't require approval for fees.

      for (uint i = 0; i < names.length; i++) {
          // update component and approve MOT for charging fees
          updateComponent(names[i]);
      }

      // REST OF CODE
   }
```

a) We don’t need new parameters to set the component. This is because of initializing taking the `ComponentList` address as a parameter. This component list is aware of the LOCKER address.

b) You should utilize the active Olympus Component List, then you have immediate access to all our components, including the capability to update to the latest versions once your fund is published.

c) Exclude Locker, Locker is not Fee Chargeable so it is not required to approve MOT for its use.

> excludedComponents.push(LOCKER);

c) We add LOCKER to the name list (and increase the size of the list to 4). LOCKER already contains the same name that the Locker component holds in our component list, so it will be automatically selected. UpdateComponent inside the loop will choose the latest version of the LockerProvider. Most of the core components of Olympus are free, but some of them have a fee charge in MOT. For this reason, it is important to encourage to the fund owner to keep a certain amount of MOT in his fund.

5. Initialize locker

In this case, we don’t have a unique interval, but an interval for each token. We need to initialize each interval the first time a new token is added into the fund. No worries, that logic is already present:

```javascript
 function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success) {
       ERC20 _tokenAddress;
       LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

       for (uint i = 0; i < _updatedTokens.length; i++) {
           _tokenAddress = _updatedTokens[i];
           amounts[_tokenAddress] = _tokenAddress.balanceOf(this);
           if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress]) {
               tokens.push(_tokenAddress);
               activeTokens[_tokenAddress] = true;

               // Add this line
               lockerProvider.setTimeInterval(bytes32(address(_tokenAddress)),TRADE_INTERVAL);

               continue;
           }
           emit TokenUpdated(_tokenAddress, amounts[_tokenAddress]);
       }
       return true;
   }
```
LockerProvider is in our component list, we get the component by the name we provided and cast the address to the locker interface, so Solidity can understand how we want to utilize it.
In the case that a token is new `if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress])` we add the line to initialize the timer.
Calling setTimeInterval we initialize the timer to 7 days value stored in TRADE_INTERVAL variable. Realize that we need a name to identify the interval itself, for that we use the same address of the ERC20 token (getting the address and casting it to bytes32 will do the job).


4) We check the interval before buying a token.

```javascript
  function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
      public onlyOwner returns(bool) {

      // Get the component
      LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

      // Check whether or not we have the required ethAmount
      uint totalEthRequired = 0;
      for (uint i = 0; i < _amounts.length; i++) {
          // Utilize the same loop to check the interval
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
```

We get the lockerProvider in the same way as in the step before.
The buyTokens function checks the total amount of ETH required to buy all the tokens. We take advantage of this loop and also check the interval (avoiding to create a second loop).
If it is the first time we buy a token, the current value of the interval will be 0. (So the token will be purchased). After the purchase, the updateTokens function will initialize the interval to 7 days. The second time we trade with this token the interval will apply.
There is a small issue, the interval won’t apply until the second purchase. You can think about how to apply the interval from the first moment, in an optimal way, as a challenge.

5.  Add the interval checking for sell tokens

```javascript
    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
    public onlyOwner returns (bool) {

          LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));
          OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

          for (uint i = 0; i < tokens.length; i++) {

              lockerProvider.checkLockerByTime(bytes32(address(\_tokens[i])));

              ERC20NoReturn(_tokens[i]).approve(exchange, 0);
              ERC20NoReturn(_tokens[i]).approve(exchange, _amounts[i]);

          }

          require(exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId));
          updateTokens(_tokens);
          return true;
    }
```
Similar code as before, we get the component, and in the same loop we are giving approval to the exchange provider to exchange the token, we check the locker provider.
If the timer is not initialized, it will be initialized through the usage of the updateTokens internal function.
Remember the checkInterval will revert if any of the token intervals has not passed yet, reverting the complete selling transaction.

## Testing

We continue with the test file that we have utilized to test our own fund, and we will add the required modifications to test this new functionality.

1. First, enable Locker component.

In kovan or mainnet the component list is already set and the providers have already been updated. But in local we need to set this manually.

```javascript
const LockerProvider = artifacts.require("Locker");
```

First, import the LockerProvider.
Then, in the `before(` function we set the component, the same as the other providers

```javascript
  let asyncWithdraw;
  let componentList;
  let LockerProvider; // <-- Add this line
```

```javascript
  exchange = await ExchangeProvider.deployed();
  asyncWithdraw = await AsyncWithdraw.deployed();
  lockerProvider = await LockerProvider.deployed(); // <-- Add this line
 ```

```javascript
  componentList.setComponent(DerivativeProviders.WITHDRAW, asyncWithdraw.address);
  componentList.setComponent(DerivativeProviders.LOCKER, lockerProvider.address); // <-- Add this line
```

We are declaring the variable, initializing the locker (deployed), and setting it in our component list.

We can observe the next interesting function in the test:

```javascript
    await exchange.setMotAddress(mockMOT.address);
```
For some providers, the fund manager is required to pay a small amount of MOT for calling functions.

The MOT address is hardcoded in the code and belongs to the real MOT mainnet address. But in the scenarios of Kovan or test cases, we need to set the MOT address manually.
  > In kovan set the MOT kovan address.
  > In test cases, use the mockMOT which is a contract created as a mock to mock the behavior of the MOT coin (a "normal" ERC20 token).



2. Why do our tests still fail?

In the new derivative, we have added a limitation not to operate the same token more than once every 7 days. Let's make a trace of the lock provider:

```
 State: Token A Lock Delay 0, next call 0.
 + Test buyTokens
    - Check Lock next before 0, OK. Set next call to  (now+0 delay) = now
    - Initialize delay to 7 days.
 State: Token A Lock delay 7 days next call: now
 + Sell tokens
    - Check lock before now, OK. Set next call before (now+7 days) = in 7 days.
    - No require to initialize delay.
 State: Token A Lock delay in 7 days, call in 7 days.
  + Sell ETH on withdrawing (This test will buyTokens before withdraw and will revert )
 ```

 We can see that the initialization takes part after the first token is sold, and the delay is applied after next time the locker component is checked. In this situation, we encounter next problems

 a) We need to add a test to check whether or not the delay is working and the function is reverting.
 b) If we are gonna test any other operation we will not be able to test, because test cases would need to wait around 7 days to complete the check.

3. Introduction to stubs

One easy solution is to make the delay time configurable, so we can just change the configuration to a few seconds for the test cases. But for the trust of the investors, we want this number to be fixed and not modifiable, or the fund manager could modify it to his own
advantage.

The first option is to initialize a value in the initialize function (which could be a reasonable solution). However, we need to be sure that the value is the same for all the instances of this fund.

No worries, we still have a solution, we can mockup the derivative. Create a new mockup file in `myOwnContracts/MyContractStub.sol`. In this file we will inherit from our derivative, but override the declaration of the interval to zero seconds. Furthermore, we need to override the constructor.

After you change the derivative's name to your own chosen name, the code should look similar to this:

```javascript

import "./OlympusTutorialFund.sol";


contract OlympusTutorialFundStub is OlympusTutorialFund {
    using SafeMath for uint256;

     constructor(
      string _name,
      string _symbol,
      string _description,
      string _category,
      uint _decimals
     ) public {
        super(_name, _symbol, _description, _decimals);
        TRADE_INTERVAL = 0 seconds;
    }
}
```

  > Why not override TRADE_INTERVAL in the derivative `uint public TRADE_INTERVAL = 0 seconds`?
    The reason is that even if we override the value with a new variable, the call of the parent functions buyTokens and sell tokens will be still accessing the super.TRADE_INTERVAL which is 7 days and fail.

And in the test cases, we will require to use the stub:

```javascript
const Fund = artifacts.require("OlympusTutorialFundStub");
```

This will be enough to pass the test cases again.

3. Test the special scenario

Let's add a config function to our Stub. This stub is only being used in tests, and should not be used in reality.

```javascript
function setTradeInterval(uint _seconds) external {
        TRADE_INTERVAL = _seconds;
    }
```

In the previous flow, the tokens were initialized with a zero second interval when they are operated for the first time.
The easiest method is to create a new derivative. We can do this at the end of the test.

```javascript
// ----------------------------- LOCKER CONDITIONS ----------------------
  // We create a new contract with the token timer initialized.
  it("Create a fund with locker interval", async () => {
    fund = await Fund.new(
      fundData.name,
      fundData.symbol,
      fundData.description,
      fundData.category,
      fundData.decimals
    );
    await fund.initialize(componentList.address, fundData.maxInvestors);
    // Remember to set the trade interval
    await fund.setTradeInterval(2); // Two seconds
    assert.equal((await fund.status()).toNumber(), 1); // Keep some condition to check creation is correct
  });
```

Now, we can add a scenario for buying tokens:

```javascript

  it("Buy tokens reverts before time out", async () => {
    let tx;
    // Investors
    tx = await fund.invest({ value: web3.toWei(1.5, "ether"), from: investorA });
    tx = await fund.invest({ value: web3.toWei(1.5, "ether"), from: investorB });
    // Prepare to buy tokens
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    // First time will initialize the locker
    tx = await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    // Second time will set the timer
    tx = await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    // Third time shall revert
    await calc.assertReverts(
      async () => await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0])),
      'Buy shall revert before timeout'
    );
    await calc.waitSeconds(2); // Make sure next test start fresh
  });
```

a) First, we invest some ether. Will invest 3ETH and try to buy 3 times tokens.
b) Then we check the rates and prepare the amounts array. The rates are provided by the exchange provider
from real tokens price. In the local test, we can call our mockupKyber which will provide us the mock rates for the tokens.
We will set the amounts array to 0.5eth for each token (1 ETH in total)
c) The first time we buy, the trading interval gets initialized for each token. The second time the trading interval gets
added (so it shall also succeed). Finally, the third trial shall revert.
d) We add `calc.waitSeconds` to make sure we can operate with the token within the next test.

Sell Token test

```javascript
 it('Sell tokens shall revert before timeout', async () => {

    // Prepare sell tokens
    const fundTokensAndBalance = await fund.getTokens();
    const balances = fundTokensAndBalance[1];
    const sellRates = await Promise.all(
      tokens.map(async (token, index) => await mockKyber.getExpectedRate(token, ethToken, balances[index]))
    );
    // We sell half by half
    // First shall succeed after timeout
    tx = await fund.sellTokens("", fundTokensAndBalance[0], balances.map((balance) => balance / 2), sellRates.map(rate => rate[0]));
    // Second shall fail
    await calc.assertReverts(
      async () => fund.sellTokens("", fundTokensAndBalance[0], balances.map((balance) => balance / 2), sellRates.map(rate => rate[0])),
      'Cant sell before timeout'
    );
  });
```


a) getTokens is returning `[tokens[], balances[]]` so we keep the balances only. While rates are returning `Array<[basePrice, slippagePrice]>` so we get the slippage rate only.
b) We sell the tokens half by half (otherwise the next sell transaction does not have any tokens to sell). The first time, it will work, as the last operation was more than 1 second ago. Second sell token will revert.

To continue we this, we can make the test cases more complicated, add more assert statements, or create the last scenarios for the withdraw and close features.

You can also try to check the value in lockerProvider (timeInterval and unlock time). In the initialization we have set the variable `lockerProvider = await LockerProvider.deployed();` that will allow you to query directly the public mapping attributes of the provider.

4. Migrations


In the file `/migrations/2_deploy_contracts.js` we can find the script which is deploying the contracts on the blockchain.
a) It deploys and configures all required contracts each test run (which takes time).
b) It can be run with a valid private key onto any configured network. You can check the command we created npm run `testKovan` in `package.json`.

In our case, it takes a long time to deploy all contracts, many of which are most of the time not required for a specific test case. In order to optimize it, we have created the suite concept, one attribute that will allow us
to select which kind of contracts we want to deploy. You can find it at the end of the migrations file

```javascript
if (flags.suite && typeof eval(`deploy${flags.suite}`) === "function") {
    return eval(`deploy${flags.suite}(deployer,network)`);
}
```

It means, if we run the test with a suit name `--suite=MyDerivative`, the code will find a function
called `deployMyDerivative` and run it (instead of running `deploy()` or `deployOnKovan()`).

Let's create a suite function for our test

```javascript

function deployTutorial(deployer, network) {
 async function deployTutorial(deployer, network) {
  await deployer.deploy([
    Locker,
    MarketplaceProvider,
    ComponentList,
    [MockToken, "", "MOT", 18, mockTokenSupply],
  ]);
  await deployExchange(deployer, network);
}
}
```
a) You can see that the the function receives a deployer object that can deploy the contracts [Check Documentation](https://truffleframework.com/docs/truffle/testing/testing-your-contracts) and information of the network that we are deploying on. You can use this information to further customize your deployment function.

b) Finally, we only need to deploy the Locker, MarketPlaceProvider and ComponentList and MockToken, for our test.There is a slight difference in the syntax for deploying contracts with parameters and deploying contracts without. An example of a contract that does need parameters can be found in the `deployExchange` function.

Changing the filenames to your own filenames, we can run the command like this:

  > truffle  test--suite=Tutorial  test/tutorial/TestTutorialFund.js

We will still see that all the components get compiled, but they will not be deployed.


