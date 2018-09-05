pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract RebalanceInterface is ComponentInterface {
    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale) external
        returns(uint[] _recalculatedAmountsToBuy);
    function rebalanceGetTokensToSellAndBuy(uint _rebalanceDeltaPercentage) external returns
        (address[] _tokensToSell, uint[] _amountsToSell, address[] _tokensToBuy, uint[] _amountsToBuy, address[] _tokensWithPriceIssues);
    function finalize() external returns(bool success);
    function getRebalanceInProgress() external returns (bool inProgress);
    function needsRebalance(uint _rebalanceDeltaPercentage, address _targetAddress) external view returns (bool _needsRebalance);
    function getTotalIndexValueWithoutCache(address _indexAddress) public view returns (uint totalValue);
}
