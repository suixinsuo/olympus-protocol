
pragma solidity 0.4.24;


contract LockerInterface {
    /*
     * Inside a require shall be performed
     */
    function checkLock(bytes32 _lockerName) external;
    function setIntervalBlocks(bytes32 _lockerName, uint _blocks) external;

}

