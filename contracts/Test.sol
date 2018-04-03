pragma solidity ^0.4.19;
// pragma experimental ABIEncoderV2;
pragma solidity ^0.4.19;

import "./OlympusLabsCore.sol";


contract Test {
    using SafeMath for uint256;

    OlymplusLabsCore public core;
    uint strategyId = 2;

    function Test()  public {
        core = new OlymplusLabsCore();
        core.resetOrderIdTo(now);
    }

    function() public payable {
        core.buyIndex.value(msg.value)(strategyId, msg.sender);
    }

    function setStrategyId(uint _strategyId) public returns(bool)
    {
        strategyId = _strategyId;
    }
}
