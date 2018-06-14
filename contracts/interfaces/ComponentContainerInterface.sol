pragma solidity 0.4.24;


contract ComponentContainerInterface {
    mapping (string => address) public components;

    event ComponentUpdated (string _name, address _componentAddress);
    
    function setComponent(string _name, address _providerAddress) public returns (bool success);
}
