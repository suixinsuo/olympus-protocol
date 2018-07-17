
pragma solidity 0.4.24;


contract LockerInterface {
    /*
     * Inside a require shall be performed
     */
    function checkLock(bytes32 _timerName) external;
    function setTimer(bytes32 _timerName, uint _hours) external;

}

