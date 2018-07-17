
pragma solidity 0.4.24;


contract LockerInterface {
    /*
     * Inside a require shall be performed
     */
    function checkLockByBlockNumber(bytes32 _lockerName) external;
    function setIntervalBlocks(bytes32 _lockerName, uint _blocks) external;
    function checkLockByHours(bytes32 _timerName) external;
    function setIntervalHours(bytes32 _timerName, uint _blocks) external;
}

