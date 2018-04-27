pragma solidity ^0.4.18;

import "./PermissionProviderInterface.sol";

contract PermissionProvider is PermissionProviderInterface {
    /**
    * A constant role name for indicating admins.
    */
    string public constant ROLE_ADMIN = "admin";
    string public constant CORE = "core";
    string public constant STORAGE = "storage";

    modifier onlyCore()
    {
        checkRole(msg.sender, CORE);
        _;
    }

    modifier onlyStorage()
    {
        checkRole(msg.sender, STORAGE);
        _;
    }

    /**
    * @dev constructor. Sets msg.sender as admin by default
    */
    function PermissionProvider() public {
        addRole(msg.sender, ROLE_ADMIN);
    }

    function adminAddRoleControl(address _addr, string _roleName) onlyAdmin public {
        addRole(_addr, _roleName);
    }

    function adminRemoveRoleControl(address _addr, string _roleName) onlyAdmin public {
        removeRole(_addr, _roleName);
    }

    function changeAdmin(address _newAdmin) onlyAdmin public returns (bool success) {
        adminAddRole(_newAdmin, ROLE_ADMIN);
        adminRemoveRole(msg.sender, ROLE_ADMIN);
        return true;
    }

    function adminAddCore(address _addr) onlyAdmin public {
        adminAddRoleControl(_addr, CORE);
    }

    function adminRemoveCore(address _addr) onlyAdmin public{
        adminRemoveRoleControl(_addr, CORE);
    }

    function hasCore(address _addr) public view returns(bool success) {
        return hasRole(_addr, CORE) || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddCoreOwner(address _addr) onlyAdmin public {
        adminAddRoleControl(_addr, "CoreOwner");
    }

    function adminRemoveCoreOwner(address _addr) onlyAdmin public{
        adminRemoveRoleControl(_addr, "CoreOwner");
    }

    function hasCoreOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "CoreOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddStrategyOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "StrategyOwner");
    }

    function adminRemoveStrategyOwner(address _addr) onlyAdmin public{
        adminRemoveRole(_addr, "StrategyOwner");
    }

    function hasStrategyOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "StrategyOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddPriceOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "PriceOwner");
    }

    function adminRemovePriceOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "PriceOwner");
    }

    function hasPriceOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "PriceOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddExchangeOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "ExchangeOwner");
    }

    function adminRemoveExchangeOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "ExchangeOwner");
    }

    function hasExchangeOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "ExchangeOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddExchangeAdapterOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "ExchangeAdapterOwner");
    }

    function adminRemoveExchangeAdapterOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "ExchangeAdapterOwner");
    }

    function hasExchangeAdapterOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "ExchangeAdapterOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddStorageOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "StorageOwner");
    }

    function adminRemoveStorageOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "StorageOwner");
    }

    function hasStorageOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "StorageOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddWhitelistOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "WhitelistOwner");
    }

    function adminRemoveWhitelistOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "WhitelistOwner");
    }

    function hasWhitelistOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "WhitelistOwner") || hasRole(_addr, ROLE_ADMIN);
    }

    function adminAddStorage(address _addr) onlyAdmin public {
        adminAddRoleControl(_addr, STORAGE);
    }

    function adminRemoveStorage(address _addr) onlyAdmin public{
        adminRemoveRoleControl(_addr, STORAGE);
    }

    function hasStorage(address _addr) public view returns(bool success) {
        return hasRole(_addr, STORAGE) || hasRole(_addr, ROLE_ADMIN);
    }
}
