
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/RiskControlInterface.sol";
import "../../contracts/interfaces/FeeChargerInterface.sol";


contract MockRiskControl is MockDerivative  {
    RiskControlInterface riskControl;
    constructor (RiskControlInterface _riskControl) public {
        riskControl = _riskControl;
    }


    function initialize() public {
        FeeChargerInterface(address(riskControl)).MOT().approve(address(riskControl), 0);
        FeeChargerInterface(address(riskControl)).MOT().approve(address(riskControl), 2 ** 256 - 1);
    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) public returns(bool) {
        return riskControl.hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate);
    }
}

