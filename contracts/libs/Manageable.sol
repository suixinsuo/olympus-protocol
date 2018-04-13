pragma solidity ^0.4.18;

// import "./Ownable.sol";


contract Manageable {
    event ProviderUpdated (uint8 name, address hash);

    // this is used to hold the addresses of the providers.
    mapping (uint8 => address) public subContracts;

    function setProvider(uint8 _id, address _providerAddress) public returns (bool success) {
        require(_providerAddress != address(0));
        subContracts[_id] = _providerAddress;
        emit ProviderUpdated(_id, _providerAddress);

        return true;
    }
}
