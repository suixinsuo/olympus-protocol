
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


    function checkLock(bytes32 _lockerName) external {
        require(block.number >= locker[msg.sender][_lockerName] + intervalBlocks[msg.sender][_lockerName]);
        locker[msg.sender][_lockerName] = block.number;
    }

    function setIntervalBlocks(bytes32 _lockerName, uint _blocks) external {
        intervalBlocks[msg.sender][_lockerName] = _blocks;
    }

}

