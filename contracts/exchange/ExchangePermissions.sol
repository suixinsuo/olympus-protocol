pragma solidity ^0.4.17;
import "../permission/PermissionProviderInterface.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ExchangePermissions is Ownable {

    PermissionProviderInterface internal permissionProvider;

    function ExchangePermissions(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    modifier onlyExchangeOwner() {
        require(permissionProvider.hasExchangeOwner(msg.sender));
        _;
    }

    modifier onlyCoreOwner() {
        require(permissionProvider.hasCoreOwner(msg.sender));
        _;
    }

    modifier onlyAdapterOwner() {
        require(permissionProvider.hasExchangeAdapterOwner(msg.sender));
        _;
    }
}