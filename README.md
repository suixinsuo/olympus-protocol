
# Protocol Architecture

## Index Main Architecture

```
<User>            [Core Smart Contract]           [Price Oracle]              [Exchange Privider]       <Exchange>
  |------- send eth ------->|
                            |------- request price ----->|
                                                         |------------------- request price --------------->|
                                                         |<------------------ response price ---------------|
                            |<------ response price -----|
                            |------- split orders ------- && ------ make orders ------->|
                                                                                        |---- exchange ---->|
                                                                                        |<--- done ---------|
  |<----------------------- orders completion && return ask tokens ---------------------|
  ```

### Exchange Privider

```node
contract ExchangeProvider {

  struct Status {
    bool isRunning,
    string name,
    uint fee
  }

  event TradeSuccess(
    string tradeId,
    uint totalAmount,
    uint completedAmount,
  );

  event TradeFailure(
    string tradeId,
    uint errorCode
  );

  function ExchangeProvider() public {}

  function getProviderStatus() public return (Status) { ... }

  function getExpectedRate(address _from, address _to) public return (uint) { ... }

  function excuteTrade(address _from, uint _amount, address _to) public payable return (string) { ... }

}
```

### Price Oracle
### Core
