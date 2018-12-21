pragma solidity 0.4.24;
import "../Oracle/ChainlinkOracle.sol";

contract MockOracle is ChainlinkOracle {
    function setMockTargetPrice(uint _targetPrice) public  {
        currentPrice = (ETH_PRECISION).mul(USD_PRECISION).div(_targetPrice);
        lastUpdateTime = now;
    }
    function setMockLastuUdateTime(uint _targetTime) public  {
        lastUpdateTime = _targetTime;
    }
}