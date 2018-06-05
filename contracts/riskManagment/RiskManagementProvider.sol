pragma solidity ^0.4.23;
import "../permission/PermissionProviderInterface.sol";
import "./RiskManagementProviderInterface.sol";

contract RiskManagementProvider is RiskManagementProviderInterface {

    PermissionProviderInterface internal permissionProvider;
    bool public enabled;

    constructor (address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }


    modifier onlyRiskManagementOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_RISK_OWNER()));
        _;
    }

    function enable() public onlyRiskManagementOwner  {
        enabled = true;
    }

    function disable() public onlyRiskManagementOwner  {
        enabled = false;
    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint256 _amount) external view returns(bool) {
        if(!this.enabled()) {
          return false;
        }

        return false;
    }

}
