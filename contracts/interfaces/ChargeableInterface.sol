pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract ChargeableInterface is ComponentInterface {

    uint public DENOMINATOR;
    function calculateFee(address _caller, uint _amount) external returns(uint totalFeeAmount);
    function setFeePercentage(uint _fee) external returns (bool succes);
    function getFeePercentage() external returns (uint feePercentage);

 }
