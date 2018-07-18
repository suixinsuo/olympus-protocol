
pragma solidity 0.4.24;


contract LockerInterface {
    // Inside a require shall be performed
    function checkLockByBlockNumber(bytes32 _lockerName) external;

    function setBlockInterval(bytes32 _lockerName, uint _blocks) external;
    function setMultipleBlockIntervals(bytes32[] _lockerNames, uint[] _blocks) external;

    // Inside a require shall be performed
    function checkLockerByTime(bytes32 _timerName) external;

    function setTimeInterval(bytes32 _timerName, uint _seconds) external;
    function setMultpleTimeIntervals(bytes32[] _timerNames, uint[] _hours) external;

}

