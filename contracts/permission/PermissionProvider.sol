pragma solidity ^0.4.18;

import "./PermissionProviderInterface.sol";

contract PermissionProvider is PermissionProviderInterface {
    /**
    * A constant role name for indicating admins.
    */
    string public constant ROLE_ADMIN = "admin";
    string public constant ROLE_Core = 'core';
    string public constant ROLE_Storage = 'storage';
    string public constant ROLE_CoreOwner = 'CoreOwner';
    string public constant ROLE_StrategyOwner = 'StrategyOwner';
    string public constant ROLE_PriceOwner = 'PriceOwner';
    string public constant ROLE_ExchangeOwner = 'ExchangeOwner';
    string public constant ROLE_ExchangeAdapterOwner = 'ExchangeAdapterOwner';
    string public constant ROLE_StorageOwner = 'StorageOwner';
    string public constant ROLE_WhitelistOwner = 'WhitelistOwner';

    modifier onlyBy(string _roleName)
    {
        checkRole(msg.sender, _roleName);
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

    function adminAdd(string _roleName, address _addr) onlyAdmin public {
        adminAddRoleControl(_addr, _roleName);
    }

    function adminRemove(string _roleName, address _addr) onlyAdmin public{
        adminRemoveRoleControl(_addr, _roleName);
    }    

    function has(string _roleName, address _addr) public view returns(bool success) {
        return hasRole(_addr, _roleName) || hasRole(_addr, ROLE_ADMIN);
    }    
}
