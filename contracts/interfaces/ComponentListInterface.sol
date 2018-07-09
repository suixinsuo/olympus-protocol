pragma solidity 0.4.24;


contract ComponentListInterface {
    event ComponentUpdated (string _name, string _version, address _componentAddress);
    function setComponent(string _name, address _componentAddress) public returns (bool);
    function getComponent(string _name, string _version) public view returns (address);
    function getLatestComponent(string _name) public view returns(address);
}
