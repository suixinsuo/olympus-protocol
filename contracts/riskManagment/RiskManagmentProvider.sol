pragma solidity ^0.4.23;
import "../permission/PermissionProviderInterface.sol";
import "./RiskManagmentProviderInterface.sol";

contract RiskManagmentProvider is RiskManagmentProviderInterface {

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

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint256 _amount) external view returns(bool) {
        if(!this.enabled()) {
          return false;
        }

        return false;
    }

}
