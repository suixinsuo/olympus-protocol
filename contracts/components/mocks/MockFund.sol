pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/FundInterface.sol";


contract MockFund is FundInterface, MockDerivative {
    uint public todo;
}
