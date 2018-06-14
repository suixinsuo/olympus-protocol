pragma solidity ^0.4.23;

import "./ComponentInterface.sol";


contract RiskControlInterface is ComponentInterface { 
    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate)
        external returns(bool isRisky);
}