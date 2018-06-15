pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract RiskControlInterface is ComponentInterface { 
    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate)
        external view returns(bool isRisky);
}