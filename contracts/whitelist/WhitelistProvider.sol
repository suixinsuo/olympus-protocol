pragma solidity ^0.4.17;
import "../permission/PermissionProviderInterface.sol";
import { TypeDefinitions as TD } from "../libs/provider.sol";

contract WhitelistProvider {

    PermissionProviderInterface internal permissionProvider;

    mapping (address=>bool) allow;
    bool public enabled;

    function WhitelistProvider(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    modifier onlyWhitelistOwner() {
        require(permissionProvider.has(msg.sender, TD.ROLE_WHITELIST_OWNER));
        _;
    }

    function enable() public onlyWhitelistOwner returns(bool){
        enabled = true;
    }

    function disable() public onlyWhitelistOwner returns(bool){
        enabled = false;
    }

    function setAllow(address[] accounts, bool isAllow) public onlyWhitelistOwner returns(bool){

        for(uint i = 0; i < accounts.length; i++){
            require(accounts[i] != 0x0);
            allow[accounts[i]] = isAllow;
        }
        return true;
    }

    function isAllowed(address account) external view returns(bool){
        return enabled? allow[account]:true;
    }
}
