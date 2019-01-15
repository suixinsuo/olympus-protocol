pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract RebalanceSwapInterface is ComponentInterface {
    function needsRebalance(uint _rebalanceDeltaPercentage, address _targetAddress) external view returns (bool _needsRebalance);
    function rebalanceGetTokensToTrade(uint _rebalanceDeltaPercentage) external returns (address[],address[],uint[]);
    function getTotalIndexValueWithoutCache(address _indexAddress) public view returns (uint totalValue);
}
