pragma solidity 0.4.24;


contract Debugger {

    event LogN(uint number, string text);
    event LogA(address _address, string text);
    event LogS(string _string);
    event LogB(bool _bool, string text);
    event LogB32(bytes32 _bytes32, string text );

    mapping( uint => bool) public d; //enabled

    function disableBlock(uint _number, bool _state) external {
        d[_number] = _state;
    }

}
