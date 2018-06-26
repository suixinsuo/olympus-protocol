pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/ComponentInterface.sol";

contract ComponentList is Ownable{

    mapping(string => mapping(string => address)) components;

    event ComponentUpdated (string _name, string _version, address _componentAddress);

    function setComponent(string _name, address _componentAddress) public payable onlyOwner{
        ComponentInterface c = ComponentInterface(_componentAddress);
        components[_name][c.version()] = _componentAddress;
        emit ComponentUpdated(_name, c.version(), _componentAddress);
    }

    function getComponent(string _name, string _version) public view returns (address){
        return components[_name][_version];
    }
    
}