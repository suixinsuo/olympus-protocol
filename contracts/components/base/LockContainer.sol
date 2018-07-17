
pragma solidity 0.4.24;

import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/LockerInterface.sol";

contract Locker is ComponentInterface, LockerInterface  {

    string public name = "LockerContainer";
    string public description = "Simplifies the locker logic";
    string public category = "Category";
    string public version = "1.0";

    mapping(address => mapping(string => uint)) hoursInterval;
    mapping(address => mapping(string => uint)) time;


    function checkLock(string _timerName) external {
        require(now >= time[msg.sender][_timerName] + (hoursInterval[msg.sender][_timerName] * 60 * 60));
        time[msg.sender][_timerName] = now;
    }

    function setTimer(string _timerName, uint _hours) external {
        hoursInterval[msg.sender][_timerName] = _hours;
    }

}

