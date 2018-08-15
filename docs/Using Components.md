## 7. Using Olympus components.

Olympus offer a great variety of components that allow us to increase the capability of the fund with only a few lines. In this scenario we want to give some guarantee to our investors that his money is not going to be wasted in buy/sell transactions by the owner. We will allow the owner only to make operations on a concrete token once every 1 week.

In order to accomplish that, we need a set of new variables and logics, hopefully, we can also use the interface `LockerContainer` that will allow us to create any kind of timers in our fund. You can check [LockerProvider ABI](http://broken-link) in the documentation.

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

We create a constant that will represent the locker component in our component list. Every derivative extends from `ComponentList` base class (in `contracts/components/base` folder. This class allow us to storate any kind of provider (Olympus or your own components set). This key LockerProvider is they name in which the component is identified on our component list.
Realize we set bytes32 instead of string. In the code both looks the same but in solidity bytes32 utilize much less memory making a big difference of gas while deploying the contract. (As our team experienced in the code optimization phases).
We set a constant of 7 days between operations.

We initialize the component

`````
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
`````

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

5.  Add the interval check in sell tokens
    function sellTokens(bytes32 \_exchangeId, ERC20Extended[] \_tokens, uint[] \_amounts, uint[] \_rates)
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
Similar code as before, we get the component, and in the same loop we are giving approval to the exchange provider to exchange the token, we check the locker provider.
If the timer is not initialize will be initialize while using updateTokens internal function.
Remember the checkInterval will revert if any of the tokens delay hasn’t pass, reverting the full selling transaction.
