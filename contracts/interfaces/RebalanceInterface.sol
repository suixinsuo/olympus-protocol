pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract RebalanceInterface is ComponentInterface {
    // this should be called until it returns true.
    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale, uint[] _amountsToBuy) external pure
        returns(uint[] recalculatedAmountsToBuy);
    function rebalanceGetTokensToSellAndBuy() external view returns
        (address[] tokensToSell, uint[] amountsToSell, address[] tokensToBuy, uint[] amountsToBuy, address[] tokensWithPriceIssues);
}
