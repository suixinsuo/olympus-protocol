pragma solidity 0.4.24;

import "../../interfaces/DerivativeInterface.sol";

contract ComponentContainer is DerivativeInterface {

    function setComponent(string _name, address _providerAddress) public returns (bool success) {
        components[_name] = _providerAddress;
        return true;
    }
}

