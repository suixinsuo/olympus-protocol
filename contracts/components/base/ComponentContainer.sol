pragma solidity 0.4.24;

import "../../interfaces/DerivativeInterface.sol";

contract ComponentContainer is ComponentContainerInterface {

    function setComponent(string _name, address _componentAddress) public returns (bool success) {
        components[_name] = _componentAddress;
        return true;
    }

    function getComponentByName(string _name) external view returns (address) {
        return components[_name];
    }
}

