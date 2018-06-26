pragma solidity 0.4.24;

import "./interfaces/ComponentInterface.sol";

contract ComponentList {

    mapping(string => mapping(string => address)) components;

    event ComponentUpdated (string _name, string _version, address _componentAddress);

    function setComponent(string _name, address _componentAddress) public payable {
        ComponentInterface c = ComponentInterface(_componentAddress);
        components[_name][c.version()] = _componentAddress;
        emit ComponentUpdated(_name, c.version(), _componentAddress);
    }

    function getComponent(string _name, string _version) public view returns (address){
        return components[_name][_version];
    }
}