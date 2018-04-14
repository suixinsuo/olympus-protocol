pragma solidity ^0.4.18;

import "./PermissionProviderInterface.sol";

contract PermissionProvider is PermissionProviderInterface {
    /**
    * A constant role name for indicating admins.
    */
    string public constant ROLE_ADMIN = "admin";

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
    
    function adminAddStorageOwner(address _addr) onlyAdmin public {
        adminAddRole(_addr, "StorageOwner");
    }

    function adminRemoveStorageOwner(address _addr) onlyAdmin public {
        adminRemoveRole(_addr, "StorageOwner");
    }

    function hasStorageOwner(address _addr) public view returns(bool success) {
        return hasRole(_addr, "StorageOwner") || hasRole(_addr, ROLE_ADMIN); 
    }
}