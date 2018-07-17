
pragma solidity 0.4.24;

import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/LockerInterface.sol";

contract Locker is ComponentInterface, LockerInterface  {

    string public name = "LockerContainer";
    string public description = "Simplifies the locker logic";
    string public category = "Category";
    string public version = "1.0";

    mapping(address => mapping(bytes32 => uint)) intervalBlocks;
    mapping(address => mapping(bytes32 => uint)) locker;
    mapping(address => mapping(bytes32 => uint)) intervalHours;
    mapping(address => mapping(bytes32 => uint)) timer;


    function checkLockByBlockNumber(bytes32 _lockerName) external {
        require(block.number >= locker[msg.sender][_lockerName] + intervalBlocks[msg.sender][_lockerName]);
        locker[msg.sender][_lockerName] = block.number;
    }

    function setIntervalBlocks(bytes32 _lockerName, uint _blocks) external {
        intervalBlocks[msg.sender][_lockerName] = _blocks;
    }

    function checkLockByHours(bytes32 _timerName) external {
        require(now >= timer[msg.sender][_timerName] + intervalHours[msg.sender][_timerName]);
        timer[msg.sender][_timerName] = now;
    }

    function setIntervalHours(bytes32 _timerName, uint _hours) external {
        intervalHours[msg.sender][_timerName] = _hours * 1 hours;
    }
}

