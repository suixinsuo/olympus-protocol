
pragma solidity 0.4.24;

import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/LockerInterface.sol";

contract Locker is ComponentInterface, LockerInterface  {

    string public name = "LockerContainer";
    string public description = "Simplifies the locker logic";
    string public category = "Category";
    string public version = "1.0";

    mapping(address => mapping(bytes32 => uint)) public unlockBlock;
    mapping(address => mapping(bytes32 => uint)) public blockInterval;
    mapping(address => mapping(bytes32 => uint)) public unlockTime;
    mapping(address => mapping(bytes32 => uint)) public timeInterval;


    function checkLockByBlockNumber(bytes32 _category) external {
        require(block.number >= unlockBlock[msg.sender][_category] );
        unlockBlock[msg.sender][_category] = block.number + blockInterval[msg.sender][_category];
    }

    function setBlockInterval(bytes32 _category, uint _blocks) external {
        blockInterval[msg.sender][_category] = _blocks;
    }

    function setMultipleBlockIntervals(bytes32[] _categories, uint[] _blocks) external {
        for(uint i = 0; i < _categories.length; i++){
              blockInterval[msg.sender][_categories[i]] =  _blocks[i];
        }
    }

    function checkLockerByTime(bytes32 _category) external {
        require(now >= unlockTime[msg.sender][_category] );
        unlockTime[msg.sender][_category] = now + timeInterval[msg.sender][_category];
    }

    function setTimeInterval(bytes32 _category, uint _seconds) external {
        timeInterval[msg.sender][_category] = _seconds * 1 seconds;
    }

    function setMultpleTimeIntervals(bytes32[] _categories, uint[] _secondsList) external {
        for(uint i = 0; i < _categories.length; i++) {
              timeInterval[msg.sender][_categories[i]] =  _secondsList[i] ;
        }
    }
}

