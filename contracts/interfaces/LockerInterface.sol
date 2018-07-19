
pragma solidity 0.4.24;


contract LockerInterface {
    /*
     * Inside a require shall be performed
     */
    function checkLockByBlockNumber(bytes32 _lockerName) external;
    function setIntervalBlock(bytes32 _lockerName, uint _blocks) external;
    function setIntervalBlocks(bytes32[] _lockerNames, uint[] _blocks) external;
    function checkLockByHours(bytes32 _timerName) external;
    function setIntervalHour(bytes32 _timerName, uint _hours) external;
    function setIntervalHours(bytes32[] _timerNames, uint[] _hours) external;
}

