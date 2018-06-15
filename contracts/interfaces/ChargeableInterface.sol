pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract ChargeableInterface is ComponentInterface {
    uint public constant DENOMINATOR = 10000;
    uint public feePercentage;
    string public feeName;

    function calculateFee(uint _amount)
        external
    returns(uint totalFeeAmount, address tokenAddress);
}