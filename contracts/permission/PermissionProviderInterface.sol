pragma solidity ^0.4.18;

import "../libs/Provider.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";

contract PermissionProviderInterface is Provider, RBAC {
    string public constant ROLE_ADMIN = "admin";
    string public constant ROLE_CORE = "core";
    string public constant ROLE_STORAGE = "storage";
    string public constant ROLE_CORE_OWNER = "CoreOwner";
    string public constant ROLE_STRATEGY_OWNER = "StrategyOwner";
    string public constant ROLE_PRICE_OWNER = "PriceOwner";
    string public constant ROLE_EXCHANGE_OWNER = "ExchangeOwner";
    string public constant ROLE_EXCHANGE_ADAPTER_OWNER = "ExchangeAdapterOwner";
    string public constant ROLE_STORAGE_OWNER = "StorageOwner";
    string public constant ROLE_WHITELIST_OWNER = "WhitelistOwner";
    string public constant ROLE_RISK_OWNER = "RiskManagementOwner";
    string public constant ROLE_FUND = "FundWhitelist";

    modifier onlyAdmin()
    {
        checkRole(msg.sender, ROLE_ADMIN);
        _;
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

    function changeAdmin(address _newAdmin) public returns (bool success);
    function adminAdd(address _addr, string _roleName) public;
    function adminRemove(address _addr, string _roleName) public;

    function has(address _addr, string _roleName) public view returns(bool success);
    function queryCore() public view returns(address core);
    function setCore(address _addr) public;

}
