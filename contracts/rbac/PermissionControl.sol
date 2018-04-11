pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";

contract PermissionControl is RBAC {

    // modifier onlyRole(string _roleName)
    // {
    //     checkRole(msg.sender, _roleName);
    //     _;
    // }

    function changeAdmin(address _newAdmin) onlyAdmin public returns(bool) {
        adminAddRole(_newAdmin, ROLE_ADMIN);
        adminRemoveRole(msg.sender, ROLE_ADMIN);
    }

     /**
   * A constant role name for indicating admins.
   */
    string public constant ROLE_ADMIN = "admin";

  /**
   * @dev modifier to scope access to admins
   * // reverts
   */
    modifier onlyAdmin()
    {
        checkRole(msg.sender, ROLE_ADMIN);
        _;
    }

  /**
   * @dev constructor. Sets msg.sender as admin by default
   */
    function RBACWithAdmin()
        public
    {
        addRole(msg.sender, ROLE_ADMIN);
    }

  /**
   * @dev add a role to an address
   * @param addr address
   * @param roleName the name of the role
   */
    function adminAddRole(address addr, string roleName)
        onlyAdmin
        public
    {
        addRole(addr, roleName);
    }

  /**
   * @dev remove a role from an address
   * @param addr address
   * @param roleName the name of the role
   */
    function adminRemoveRole(address addr, string roleName)
        onlyAdmin
        public
    {
        removeRole(addr, roleName);
    }
}