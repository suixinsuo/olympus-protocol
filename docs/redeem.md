# Redeem in a derivative

### Introduction

Redeem (aka, withdraw in the code) is the action that completes the loop of investment in the derivative. The investors will invest ETH in exchange of the derivative
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

In order to avoid gas consumption, withdraw strategy implemented is asynchronous, in other words, will not return the ETH immediately after a request, but
will wait for several of them and return the ETH for all the requests at once. Also withdraw is asynchronous, the contract would not be able to handle the amount of gas required to redeem 100 requests at the same time.
so it it will be redeeming in batches (10 by default). Let's see in detail how that works

### Request Withdraw

```javascript
 function requestWithdraw(uint amount)
        whenNotPaused
        withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
        external;
```

An investor will request to withdraw part of his invested amount. He can withdraw more than his total balance of the token.

For example, an investor with 1e18 tokens of the derivative, can request 1 time with 1e18, or request two times with 5e17, with the same result.
However if he tries to request 2e18, transaction will revert, or for three times redeem 5e17, the last transaction will revert.

Request withdraw contains the next modifiers:

- whenNotPaused: In case of emergency, such as an security issue, the owner can decide to pause the derivative, preventing bad actors from abusing the fund.
  When the fund is paused, the transactions will revert
- withoutRisk: Without risk will use the risk provider to check special conditions on the transaction, if the transaction is
  considered to have risk, this will fail. You can check in the risk controller which conditions could fail.

##### Parameters

​ \_amount: Amount of the derivative token the user wants to redeem. This is not ETH but the derivative token.

##### Returns

True if succeed. Revert if failed.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses

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

Withdraw will allow the owner to complete the redemption of tokens of his investors. Withdraw will handle the request in batches of 10(10 is the default value, this can be changed by calling the setMaxTransfers function). Only for the first time withdraw gets executed, withdraw will run a start frunction fixing some values of the derivative (the price, for example) that will keep constant for the rest executions.
Then, withdraw will calculate how much ETH correspond to each investor according to the derivative token redeemed, until he finish the withdraw or the maximum of transfers has been reached.

The function in the transaction will return true if the withdraw process is finished, or false if it is still pending. We can also check this by calling the withdrawInProgress function. If the withdraw process is in progress, the withdraw function needs to keep being called until it returns true.

Modifiers:

- onlyOwnerOrWhitelisted:Can only be done by the either the owner or a whitelisted address in the maintenance category. [Key=1] (for example 1 every 2 days)
- whenNotPaused: This modifier will allow our system to automatically call the withdraw function (e.g. once per day)

##### Parameters

No parameters required

##### Returns

True if all the withdraw requests have been fulfilled.
False if there are any withdraw requests pending.
For any revert, check the special scenarios section.

#### Special scenarios

- Reimbursable: At the end of the transaction, the sender of this transaction will be reimbursed for the used gas from the accumulated fee of the fund manager. If any reimbursable function reverts, check if the accumulated fee is enough to cover reimbursing the caller.

- Gas Estimation:To the web3 estimation in order to not run out of gas you shall add a margin to web3 estimation not to get out of gas.

- No ETH: In the scenario that the derivative is not holding ETH, all of the fund's ETH has been invested in different tokens, in the first transaction withdraw
  will calculate how much ETH is required to fulfil the withdraw and sell enough token amounts to get this quantity (without breaking the token proportion). The withdraw transaction will, for this reason, require more than double the gas of the other transactinpmons

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses

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

Will return true if withdraw is in progress (still some request are pending).

##### Parameters

No parameters.

##### Returns

True if is still in progress.
In this case we must keep calling until in progress returns false.
False if all request has been redeemed.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses

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

This function is not available in all the derivatives. Will tell you how much derivative tokens are pending of redeeming.
In the case that the pending withdraws are 0, calling to withdraw is not required.

##### Parameters

No parameters.

##### Returns

Total amount to redeem. BigNumber. The result is in wei.

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses

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

This function will determine the batch size for the withdraw function. By default the value is 10.
Max transfers attribute will retrieve the current max transfers value

##### Parameters

\_maxTransfers: Number of transfers done each transaction. Must be higher than 0.

##### Returns

void

#### Example code

The code below shows how to call this function with Web3. Set the correct ABI and addresses

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
const maxTransfers = 8; // Set maxTransfers to 8
derivative.setMaxTransfers(8, (err, tokenAmount) => {
  if (err) {
    return console.error(err);
  }
});
```
