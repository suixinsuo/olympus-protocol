
pragma solidity 0.4.24;

import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/LockerInterface.sol";

contract Locker is ComponentInterface, LockerInterface  {

    string public name = "LockerContainer";
    string public description = "Simplifies the locker logic";
    string public category = "Category";
    string public version = "1.0";

    mapping(address => mapping(bytes32 => uint)) hoursInterval;
    mapping(address => mapping(bytes32 => uint)) time;


    function checkLock(bytes32 _timerName) external {
        require(time[msg.sender][_timerName] >= now);
        time[msg.sender][_timerName] = now + (hoursInterval[msg.sender][_timerName] * 60 * 60);
    }

    function setTimer(bytes32 _timerName, uint _hours) external {
        hoursInterval[msg.sender][_timerName] = _hours;
    }

}

