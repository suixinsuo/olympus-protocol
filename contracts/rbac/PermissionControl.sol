pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";

contract PermissionControl is RBAC {

    modifier onlyRole(string _roleName)
    {
        checkRole(msg.sender, _roleName);
        _;
    }

    modifier onlyStrategyOwner()
    {
        checkRole(msg.sender, "StrategyOwner");
        _;
    }

    modifier onlyPriceOwner()
    {
        checkRole(msg.sender, "PriceOwner");
        _;
    }

    modifier onlyExchangeOwner()
    {
        checkRole(msg.sender, "ExchangeOwner");
        _;
    }

    modifier onlyStorageOwner()
    {
        checkRole(msg.sender, "StorageOwner");
        _;
    }

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
   * A constant role name for indicating admins.
   */
    string public constant ROLE_ADMIN = "admin";


  /**
   * @dev constructor. Sets msg.sender as admin by default
   */
    function PermissionControl()
        public
    {
        addRole(msg.sender, ROLE_ADMIN);
    }

    function changeAdmin(address _newAdmin) onlyAdmin public returns(bool) {
        adminAddRole(_newAdmin, ROLE_ADMIN);
        adminRemoveRole(msg.sender, ROLE_ADMIN);
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

    function adminAddStrategyOwner(address addr)
        onlyAdmin
        public
    {
        adminAddRole(addr, "StrategyOwner");
    }
    function adminAddPriceOwner(address addr)
        onlyAdmin
        public
    {
        adminAddRole(addr, "PriceOwner");
    }
    function adminAddExchangeOwner(address addr)
        onlyAdmin
        public
    {
        adminAddRole(addr, "ExchangeOwner");
    }
    function adminAddStorageOwner(address addr)
        onlyAdmin
        public
    {
        adminAddRole(addr, "StorageOwner");
    }

    function adminRemoveStrategyOwner(address addr)
        onlyAdmin
        public
    {
        adminRemoveRole(addr, "StrategyOwner");
    }

    function adminRemovePriceOwner(address addr)
        onlyAdmin
        public
    {
        adminRemoveRole(addr, "PriceOwner");
    }
    function adminRemoveExchangeOwner(address addr)
        onlyAdmin
        public
    {
        adminRemoveRole(addr, "ExchangeOwner");
    }
    function adminRemoveStorageOwner(address addr)
        onlyAdmin
        public
    {
        adminRemoveRole(addr, "StorageOwner");
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