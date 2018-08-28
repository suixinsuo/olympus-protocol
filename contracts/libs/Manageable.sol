pragma solidity ^0.4.22;

contract Manageable {
    event ProviderUpdated (uint8 name, address hash);

    // This is used to hold the addresses of the providers
    mapping (uint8 => address) public subContracts;
    modifier onlyOwner() {
        // Make sure that this function can't be used without being overridden
        require(true == false);
        _;
    }

    function setProvider(uint8 _id, address _providerAddress) public onlyOwner returns (bool success) {
        require(_providerAddress != 0x0);
        subContracts[_id] = _providerAddress;
        emit ProviderUpdated(_id, _providerAddress);

        return true;
    }
}
