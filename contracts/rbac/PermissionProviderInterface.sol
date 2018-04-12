pragma solidity ^0.4.18;

import "../libs/Provider.sol";
import "zeppelin-solidity/contracts/ownership/rbac/RBAC.sol";

contract PermissionProviderInterface is RBAC, Provider {
    
    modifier onlyAdmin()
    {
        checkRole(msg.sender, ROLE_ADMIN);
        _;
    }
    function changeAdmin(address _newAdmin) onlyAdmin public returns(bool success); 

    function adminAddRoleControl(address addr, string roleName) onlyAdmin public;
    function adminRemoveRoleControl(address addr, string roleName) onlyAdmin public;

    // function adminAddCoreOwner(address addr) onlyAdmin public;
    // function adminRemoveCoreOwner(address addr) onlyAdmin public;
    // function checkCoreOwner(address addr) public view returns(bool success);

    // function adminAddStrategyOwner(address addr) onlyAdmin public;
    // function adminRemoveStrategyOwner(address addr) onlyAdmin public;
    // function checkStrategyOwner(address addr) public view returns(bool success);
    
    // function adminAddPriceOwner(address addr) onlyAdmin public;
    // function adminRemovePriceOwner(address addr) onlyAdmin public;
    // function checkPriceOwner(address addr) public view returns(bool success);
    
    // function adminAddExchangeOwner(address addr) onlyAdmin public;
    // function adminRemoveExchangeOwner(address addr) onlyAdmin public;
    // function checkExchangeOwner(address addr) public view returns(bool success);
    
    // function adminAddStorageOwner(address addr) onlyAdmin public;
    // function adminRemoveStorageOwner(address addr) onlyAdmin public;
    // function checkStorageOwner(address addr) public view returns(bool success);
}
