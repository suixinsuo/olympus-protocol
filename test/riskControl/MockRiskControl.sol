
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/RiskControlInterface.sol";


contract MockRiskControl is MockDerivative  {
    RiskControlInterface riskControl;
    constructor (RiskControlInterface _riskControl) public {
        riskControl = _riskControl;
    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) public returns(bool) {
        return riskControl.hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate);
    }

    event LogNumber(string _text, uint _number);   
}

