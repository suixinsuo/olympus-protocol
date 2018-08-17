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

```
    bytes32 public constant LOCKER = "LockerProvider";
    uint public constant OPERATION_DELAY = 7 days;
```

We create a constant that will represent the locker component in our component list. Every derivative extends from `ComponentList` base class (in `contracts/components/base` folder. This class allow us to store any kind of provider (Olympus or your own component set). This key LockerProvider is they name in which the component is identified on our component list.
Take note that we use bytes32 instead of string. In the code both look the same but in solidity bytes32 utilizes much less memory making a significant difference of gas usage while deploying the contract. (As our team experienced in the code optimization phases).
We set a constant of 7 days between operations.

3. We initialize the component

`````
  function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
      // REST OF CODE

      super._initialize(_componentList);
      // We just add LOCKER to the array.
      bytes32[4] memory names = [MARKET, EXCHANGE, WITHDRAW, LOCKER];
      excludedComponents.push(LOCKER); // Add this line, because the Locker component doesn't take any fees.

      for (uint i = 0; i < names.length; i++) {
          // update component and approve MOT for charging fees
          updateComponent(names[i]);
      }

      // REST OF CODE
   }
	````
a) We don’t need new parameters to set the component. This is because of initialize taking the `ComponentList` address as parameter. This component list is aware of the LOCKER address.

b) You should utilize the active Olympus Component List, then you have immediate access to all our components, including the capability to update to the latest versions once your fund is published.

c) Exclude Locker, Locker is not fee chargeable so it is not required to approve MOT for its use.

> excludedComponents.push(LOCKER);

c) We add LOCKER to the name list (and increase the size of the list to 4). LOCKER already contains the same name that the Locker component holds in our component list, so it will be automatically selected. UpdateComponent inside the loop will choose the latest version of the LockerProvider. Most of the core components of Olympus are free, but some of them have a fee charge in MOT. For this reason, it is important to encourage to the fund owner to keep a certain amount of MOT in his fund.

5. Initialize locker

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
LockerProvider is in our component list, we get the component by the name we provided and cast the address to the locker interface, so Solidity can understand how we want to utilize it.
In the case that a token is new `if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress])` we add the line to initialize the timer.
Calling setTimeInterval we initialize the timer to 7 days value stored in TRADE_INTERVAL variable. Realize that we need a name to identify the interval itself, for that we use the same address of the ERC20 token (getting the address and casting it to bytes32 will do the job).


4) We check the interval before buying a token.

```
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
````

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
  > In test cases, use the mockMOT which is a contract created as a mock to mock the behaviour of the MOT coin (a "normal" ERC20 token).
