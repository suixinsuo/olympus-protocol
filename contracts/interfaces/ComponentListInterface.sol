pragma solidity 0.4.24;


contract ComponentListInterface {
    event ComponentUpdated (bytes32 _name, string _version, address _componentAddress);
    function setComponent(bytes32 _name, address _componentAddress) public returns (bool);
    function getComponent(bytes32 _name, string _version) public view returns (address);
    function getLatestComponent(bytes32 _name) public view returns(address);
    function getLatestComponents(bytes32[] _names) public view returns(address[]);
}
