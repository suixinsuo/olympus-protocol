pragma solidity ^0.4.18;

import "./Ownable.sol";

contract Manageable is Ownable {
    event ProviderUpdated (uint8 name, address hash);    

    // this is used to hold the addresses of the providers.
    mapping (uint8 => address) public subContracts;

    function setProvider(uint8 _name, address _providerAddress) public onlyOwner returns (bool success) {
        require(_providerAddress != address(0));
        subContracts[_name] = _providerAddress;
        /* emit */ProviderUpdated(_name, _providerAddress);

        return true;
    }
}