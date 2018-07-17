pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract RebalanceInterface is ComponentInterface {
    // this should be called until it returns true.
    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale, uint[] _amountsToBuy) external pure
        returns(uint[] _recalculatedAmountsToBuy);
    function rebalanceGetTokensToSellAndBuy(uint _rebalanceDeltaPercentage) external returns
        (address[] _tokensToSell, uint[] _amountsToSell, address[] _tokensToBuy, uint[] _amountsToBuy, address[] _tokensWithPriceIssues);
}
