pragma solidity ^0.4.23;

import "./ComponentInterface.sol";


contract RebalanceInterface is ComponentInterface {
    // this should be called until it returns true.
    function rebalance() external returns (bool success);
}