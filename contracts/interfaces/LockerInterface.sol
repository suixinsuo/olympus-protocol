
pragma solidity 0.4.24;


contract LockerInterface {
    /*
     * Inside a require shall be performed
     */
    function checkLock(string _timerName) external;
    function setTimer(string _timerName, uint _hours) external;

}

