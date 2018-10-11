# Optimization Guide

This is a draft document with the notes of which changes have allowed us
to optimize the contracts. This document is about optimization in the source code to prevent smart contracts from exceeding the gas limit

## 1. Data types

Every private or public parameter of the contract is using storage.

a) Changes the stings to bytes32
 > string public constant A = "A"
 > bytes32 public constant A = "A"

b) Reutilize information you have

Let's tell a little story:
In Olympus fund we have the mapping of amounts of the ERC20 tokens purchased by the fund with the current balance.

In order to keep this information each buy/sell operation we update the values as per ERC20 balanceOf function.

Optimization came when in other functions, while wanting to know the ERC20 balanceOf, we were calling the interface of the token (which is costly) instead of using other amounts array.

In conclusion, try to check that you are not calling to get information that you have already stored somehow.

## 2. Internal call to another contracts

a) Avoid redundant calls

We have two calls to another contract where it could be done in a single call if we change Whitelist Interface to
accept a second parameter.

```javascript
  function enableWhitelist(WhitelistKeys _key, bool enable) external onlyOwner returns(bool) {
    if(enable)
        WhitelistInterface(getComponentByName(WHITELIST)).enable(uint(_key));
     } else {
        WhitelistInterface(getComponentByName(WHITELIST)).disable(uint(_key));

     }
    }
```
  Like this

```javascript
  function enableWhitelist(WhitelistKeys _key, bool enable) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setStatus(uint(_key), enable);
        return true;
    }
```


  2. Call a contract in only one place.

Before, we called the `checkLockerByTime` function in different functions.

```javascript
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(WITHDRAW);
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(SELLTOKENS);
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(REBALANCE);
```
It turns out it is better to only call to external contracts in one place (so that the compiler doesn't duplicate this code in the bytecode)

```javascript
    function checkLocker(bytes32 category) internal {
        LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(category);
    }
```
And call our internal function
```javascript
   checkLocker(WITHDRAW);
   checkLocker(SELLTOKENS);
   checkLocker(REBALANCE);
```

This optimization saved us several hundred thousand of gas.

3. Remove call to another contracts for view functions.

Before in the index we had a function `getStep(bytes32 category) public view`. This value wasn't store in the index,
but in a StepProvider component. In order to get the value the index itself was calling to the stepProvider, to get the value from the provider which is holding it.

Remove this function, if you need to use getStep as a DAPP, then rather call the StepProvider directly, getting the provider address from `getComponentByName(Step)`. For the client side, make two view requests, which do not cost any gas and thus save some money.


## 3 Others

1. Require without comment

> `require(total > 0, "Total higher than 0")`

The editor will complain that the require doesn't have a warning text message.
These text messages are really useful to find out why a transaction reverts, however, it is currently very inconvenient to find these text messages. These strings also use a lot of storage space in the contract.

> `require(total > 0)`

is much less gas consuming.
