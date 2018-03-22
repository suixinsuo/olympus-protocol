pragma solidity ^0.4.18;

import "./Ownable.sol";

contract Manageable is Ownable {
    // this is used to hold the addresses of the providers.
    mapping (bytes32 => address) public subContracts;

    function setProvider(string _name, address _providerAddress) public onlyOwner returns (bool success) {
        require(_providerAddress != address(0));
        bytes32 key = keccak256(_name);
        subContracts[key] = _providerAddress;
        return true;
    }
}