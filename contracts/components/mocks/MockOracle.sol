pragma solidity 0.4.24;
import "../Oracle/ChainlinkOracle.sol";

contract MockOracle is ChainlinkOracle {
    function setMockTargetPrice(uint _targetPrice) public  {
        currentPrice = _targetPrice;
        lastUpdateTime = now;
    }
    function getCurrentPrice(uint _currencyUnitType) public view returns(uint256){
        return currentPrice;
    }
    function setMockLastuUdateTime(uint _targetTime) public  {
        lastUpdateTime = _targetTime;
    }
}