pragma solidity ^0.4.18;

library LogLib{

    struct log{bool isLog;}

    event LogBytes32(string _msg, bytes32 value);
    event LogUint(string _msg, uint value);
    event LogString(string _msg, string value);
    event LogBool(string _msg, bool value);
    event LogInt(string _msg, int value);

    function DebugUint(log storage, string _msg, uint value) public{
        // if(!l.isLog){return;}
        emit LogUint(_msg, value);
    }
}
