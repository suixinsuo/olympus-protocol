# Redeem in a derivative

### Introduction

Redeem (also withdraw in the code) is the action that complements the loop of investment into a derivative. The investors will invest ETH in exchange of the derivative
token, and once the derivative owner has handle it to make the price rise, the investor will be ready to redeem his tokens and get his ETH back with benefits (hopefully).

Redeem is separated in two different parts:

- First, the users will request redeem
- Second the fund will redeem all the users at the same time.

```javascript
 function requestWithdraw(uint amount)
        whenNotPaused
        withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
        external;

 function withdraw()
      onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance)
      whenNotPaused
      external returns(bool);

 function totalWithdrawPending() external view returns(uint);
 function withdrawInProgress() external view returns(bool);

function setMaxTransfers(uint _maxTransfers) external onlyOwner;
uint maxTransfers public;
```

In order to avoid gas consumption, withdraw strategy implemented is asyncronous, in other words, will not return release inmediately the ETH after a request, but
wait for several of them and released all together. Also withdraw is asyncronous, the contract wouldnt handle the gas to redeem 100 requests at the same time,
so it will be redeeming by badgets (10 by 10 by default). Let's see in detail how that works

### Request Withdraw

```javascript
 function requestWithdraw(uint amount)
        whenNotPaused
        withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
        external;
```

A investor will request to withdraw part of his amount. He can withdraw more than his total balance of the token.

For example, a investor with 1e18 tokens of the derivative, can request 1 time with 1e18, or request times with 5e17, with the same result.
But if he tries to request 2e18, transaction will revert, or 3 times 5e17, the third transaction will revert.

RequestWithdrawe contains the next modifiers:

- whenNotPaused: In case of emergency, like a security whole, the owner can decide to pause the derivative, avoiding in this way that the
  infractors keep fraudulent transactions. In case of paused the transaction will revert.
- withoutRisk: Without risk will use the risk provider to check special race conditions on the transaction, if the transaction is
  consider to have risk, this will fail. You can check in the risk controller which conditions could fail.

##### Parameters

​ \_amount: Amount of the derivative token he wants to release. This is not ETH but derivative token.

##### Returns

True if succeed. Revert if failed.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses in the place

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const derivative = web3.eth.contract(_DERIVATIVE_ABI).at(_DERIVATIVE_ADDRESS_);
const amountInWei = 1 * 10 ** 18; // Change 18 for the decimals of your contract

derivative.requestWithdraw(amountInWei, (err, results) => {
  if (err) {
    return console.error(err);
  }
});
```

### Withdraw

```javascript
  function withdraw()
  onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance)
  whenNotPaused
  external returns(bool);
```

Withdraw will allow the owner to complete the redemption of tokens of his investors. Withdraw will handle the request in badgets of 10 (by default, can be change calling to
setMaxTransfers function). At the first instance, withdraw will start, fix some values of the derivative (the price, for example), and calculate how much ETH correspond
to each investor according to the derivative token redeemed, until he finish the withdraw or the maximum of transfers has been reached.

It will return true in the transaction if the withdraw process is finish, or false if is pending. We can also check this calling withdrawInProgress function. In
case that the withdraw process is in progress, we must keep calling to withdraw functions until it returns true.

Modifiers:

- onlyOwnerOrWhitelisted: Withdraw can be done only by the owner, or any whitelisted person for manitence [Key=1] (Check allow setAllowed(addres, key, status)).
  That will allow to our system to automatic call withdraw (for example 1 every 2 days)
- whenNotPaused: Same scenario than in requestWithdraw, in case that the derivative is paused for and emergency situation, withdraw will be also paused.

##### Parameters

Not parametter requireds

##### Returns

True if all withdraw has been completed. False if still are request pending. Check special scenarios section where revert can happen.

#### Special scenarios

- Reimbursable: At the end of the transaction, the gas spended by the sender of the transaction will be reiumbursed for him. In other words, if the owner
  executes withdraw and spend 0.001 ETH in gas, this ETH will be pay back to owner from the withdraw ETH balance recerved for the owner fee. If the accumulated
  owner fee is 0 reiumbursable wont be able to pay to the caller for the action and withdraw will revert.

- Gas Estimation: Web3 is not properly estimating the gas for this function, so you shall add a margin to web3 estimation not to get out of gas.

- No ETH: In the scenario that the derivative is not holding ETH, but all his ETH has been invested in different tokens, in the first transaction withdraw
  will calculate how much ETH are required to withdraw and sell enought tokens amounts to get this quantity (without breaking the token proporcion). The withdraw transaction
  will, for this reason, require more than double gas than rest of other transactions.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses in the place

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const derivative = web3.eth.contract(_DERIVATIVE_ABI).at(_DERIVATIVE_ADDRESS_);

withdraw(); // Will be called recursively until is finished.

funtion withdraw() {
  derivative.withdraw((err, results) => {
  if (err) {
    return console.error(err);
  }
  // check if we are still in progress
  derivative.withdrawInProgress(amountInWei, (err, inProgress) => {
    if(inProgress) {
      withdraw();
    }
  });
}

});
```

### In Progress

```javascript
 function withdrawInProgress() external view returns(bool);
```

Will return if withdraw is in process (still some request are pending).

##### Parameters

No parametters.

##### Returns

True if is still in progress. In this case we must keep calling until in progress returns false.
False if all request has been redeemed.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses in the place

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const derivative = web3.eth.contract(_DERIVATIVE_ABI).at(_DERIVATIVE_ADDRESS_);

derivative.withdrawInProgress(amountInWei, (err, inProgress) => {
  if (err) {
    return console.error(err);
  }
  console.log("In progress: " + inProgress);
});
```

### Total Amount

```javascript
 function totalWithdrawPending() external view returns(uint);
```

This funtion is not available in all the derivatives. Will tell you know how much derivative tokens are pending of redeeming.
In case that is 0, calling to withdraw is not required.

##### Parameters

No parametters.

##### Returns

Total amount to redeem. BigNumber. The result is in wei.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses in the place

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const derivative = web3.eth.contract(_DERIVATIVE_ABI).at(_DERIVATIVE_ADDRESS_);

derivative.totalWithdrawPending((err, tokenAmount) => {
  if (err) {
    return console.error(err);
  }
  console.log("In progress: " + tokenAmount.toNumber());
});
```

### Withdraw max transfer

```javascript
  function setMaxTransfers(uint _maxTransfers) external onlyOwner;
  uint maxTransfers public.
```

This function allow the onwer to determinate how much transfers will do each time withdraw is called. By default the value is 10.
Max transfers attribute will retrieve the current max transfers value

##### Parameters

\_maxTransfers: Number of transfers done each transaction. Must be highter than 0.

##### Returns

void

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses in the place

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const derivative = web3.eth.contract(_DERIVATIVE_ABI).at(_DERIVATIVE_ADDRESS_);
// Check maxtransfers value
derivative.maxTransfers(8, (err, _maxTransfers) => {
  if (err) {
    return console.error(err);
  }
  console.log("Max transfers " + _maxTransfers.toNumber());
});
const maxTransfers = 8; // Set maxtranfers to 8
derivative.setMaxTransfers(8, (err, tokenAmount) => {
  if (err) {
    return console.error(err);
  }
});
```
