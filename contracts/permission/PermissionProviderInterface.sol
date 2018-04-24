pragma solidity ^0.4.18;

import "../libs/Provider.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";

contract PermissionProviderInterface is Provider, RBAC {
    
    modifier onlyAdmin()
    {
        checkRole(msg.sender, ROLE_ADMIN);
        _;
    }

    string public constant CORE = "core";

    modifier onlyCore()
    {
        checkRole(msg.sender, CORE);
        _;
    }
    
    function adminAddCore(address _addr) onlyAdmin public;
    function adminRemoveCore(address _addr) onlyAdmin public;
    function hasCore(address _addr) public view returns(bool success);

    function changeAdmin(address _newAdmin) onlyAdmin public returns(bool success); 

    function adminAddRoleControl(address addr, string roleName) onlyAdmin public;
    function adminRemoveRoleControl(address addr, string roleName) onlyAdmin public;

    function adminAddCoreOwner(address addr) onlyAdmin public;
    function adminRemoveCoreOwner(address addr) onlyAdmin public;
    function hasCoreOwner(address addr) public view returns(bool success);

    function adminAddStrategyOwner(address addr) onlyAdmin public;
    function adminRemoveStrategyOwner(address addr) onlyAdmin public;
    function hasStrategyOwner(address addr) public view returns(bool success);
    
    function adminAddPriceOwner(address addr) onlyAdmin public;
    function adminRemovePriceOwner(address addr) onlyAdmin public;
    function hasPriceOwner(address addr) public view returns(bool success);
    
    function adminAddExchangeOwner(address addr) onlyAdmin public;
    function adminRemoveExchangeOwner(address addr) onlyAdmin public;
    function hasExchangeOwner(address addr) public view returns(bool success);

    function adminAddExchangeAdapterOwner(address addr) onlyAdmin public;
    function adminRemoveExchangeAdapterOwner(address addr) onlyAdmin public;
    function hasExchangeAdapterOwner(address addr) public view returns(bool success);
    
    function adminAddStorageOwner(address addr) onlyAdmin public;
    function adminRemoveStorageOwner(address addr) onlyAdmin public;
    function hasStorageOwner(address addr) public view returns(bool success);
}
