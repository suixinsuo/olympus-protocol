pragma solidity 0.4.24;


contract ComponentContainerInterface {
    mapping (bytes32 => address) components;

    event ComponentUpdated (bytes32 _name, address _componentAddress);

    function setComponent(bytes32 _name, address _providerAddress) internal returns (bool success);
    function setComponents(bytes32[] _names, address[] _providerAddresses) internal returns (bool success);
    function getComponentByName(bytes32 name) public view returns (address);
    function getComponents(bytes32[] _names) internal view returns (address[]);

}
