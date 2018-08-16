# Optimization Guide

This is a draft document with the notes of what changes has allowed us
to optimize the contracts. This is optimization in the binary in order to allow the contract
to be deployed.

## 1. Data types

Every private or public parameter of the contract is using spaces.

a) Changes the stings to bytes32
 > string public constant A = "A"
 > bytes32 public constant A = "A"

b) Reutilize information you have

In the fund we have the mapping of amounts, that holds the actual amount of each token that the
fund has buy or sell.

In order to keep this information each buy/sell operation we update the values as per ERC20 balanceOf function.

Optimization came when in other functions, while wanting to know the ERC20 balanceOf, we were calling the interface of the token (which is costly) instead of using other amounts array.

Try to check that you are not calling to get information that you have already stored somehow.

## 2. Internal call to another contracts

a) Avoid redundant calls

We have two calls to other contract where it could be done if we change the Whitelist Interface to
accept a second parametter.
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

Before we call in different functions the checkLockerByTime.

```javascript
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(WITHDRAW);
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(SELLTOKENS);
  LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(REBALANCE);
```
But was better only to call in one place (so the code that codify the call is not duplicated in
binary)
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

From 6908624 we optimize to 6803419 setting two of this functions.


3. Remove call to another contracts for a view functions.

Before in the index we had a function `getStep(bytes32 category) public view`, that was calling the StepProvider Interface
to get the value from the provider which is holding it.

Remove this functions, if you need to getStep as external function, then rather call directly StepProvider, getting
the provider address from `getComponentByName(Step)`. For client side make 2 view transactions has no cost and we save some gas.


## 3 Others

1. Require without comment

> `require(total > 0, "Total higher than 0")`

The editor will complain that the require doesn't have a warning text message. This text messages are really usefull to
find out why a transaction revert, however etherium chain don't show them yet (so is for no use). And this string is using
a lot of space (if he have several requires in the code).

> `require(total > 0)`

is much less gas consuming.

