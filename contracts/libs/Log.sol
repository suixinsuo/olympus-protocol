pragma solidity ^0.4.18;

import "./Loglib.sol";

contract Log {

    using LogLib for LogLib.log;
    LogLib.log l;

    function setLog(bool _isLog) public{
        l.isLog = _isLog;
    }
}