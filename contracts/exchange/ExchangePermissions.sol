pragma solidity ^0.4.17;
import "../permission/PermissionProviderInterface.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import { TypeDefinitions as TD } from "../libs/Provider.sol";

contract ExchangePermissions is Ownable {

    PermissionProviderInterface internal permissionProvider;

    constructor (address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    modifier onlyExchangeOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_EXCHANGE_OWNER()));
        _;
    }

    modifier onlyCoreOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE_OWNER()));
        _;
    }

    modifier onlyAdapterOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_EXCHANGE_ADAPTER_OWNER()));
        _;
    }
}
