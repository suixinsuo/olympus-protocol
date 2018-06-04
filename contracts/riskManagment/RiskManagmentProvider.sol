pragma solidity ^0.4.23;
import "../permission/PermissionProviderInterface.sol";


contract RiskManagmentProvider {

    PermissionProviderInterface internal permissionProvider;
    bool public enabled;

    constructor (address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }


    modifier onlyRiskManagmentOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_RISK_OWNER()));
        _;
    }

    function enable() public onlyRiskManagmentOwner  {
        enabled = true;
    }

    function disable() public onlyRiskManagmentOwner  {
        enabled = false;
    }

    function hasRisk(address sender,address reciver, address token, uint32 amount) external view returns(bool) {
        return true;
    }

}
