pragma solidity 0.4.24;
import "contracts/components/Oracle/ChainlinkOracle.sol";

contract MockOracle is ChainlinkOracle {
    function setMockTargetPrice(uint _targetPrice) public  {
        currentPrice = _targetPrice;
        lastUpdateTime = now;
    }
}