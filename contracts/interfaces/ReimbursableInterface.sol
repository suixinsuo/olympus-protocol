pragma solidity 0.4.24;

import "./ComponentInterface.sol";

contract ReimbursableInterface is ComponentInterface {

    // this should be called at the beginning of a function.
    // such as rebalance and withdraw.
    function startGasCalculation() external;
    // this should be called at the last moment of the function.
    function reimburse() external returns (uint);

}
