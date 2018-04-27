pragma solidity ^0.4.18;

import "./PermissionProviderInterface.sol";

contract PermissionProvider is PermissionProviderInterface {

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

    function has(address _addr, string _roleName) public view returns(bool success) {
        return hasRole(_addr, _roleName) || hasRole(_addr, ROLE_ADMIN);
    }
}
