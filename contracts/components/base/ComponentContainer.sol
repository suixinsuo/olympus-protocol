pragma solidity 0.4.24;

import "../../interfaces/DerivativeInterface.sol";

contract ComponentContainer is ComponentContainerInterface {

    function setComponent(bytes32 _name, address _componentAddress) internal returns (bool success) {
        require(_componentAddress != address(0));
        components[_name] = _componentAddress;
        return true;
    }

    function getComponentByName(bytes32 _name) public view returns (address) {
        return components[_name];
    }

    function getComponents(bytes32[] _names) internal view returns (address[]) {
        address[] memory addresses = new address[](_names.length);
        for (uint i = 0; i < _names.length; i++) {
            addresses[i] = getComponentByName(_names[i]);
        }

        return addresses;
    }

    function setComponents(bytes32[] _names, address[] _providerAddresses) internal returns (bool success) {
        require(_names.length == _providerAddresses.length);
        require(_names.length > 0);

        for (uint i = 0; i < _names.length; i++ ) {
            setComponent(_names[i], _providerAddresses[i]);
        }

        return true;
    }
}

