pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/IndexInterface.sol";

contract MockIndex is IndexInterface, MockDerivative {
    uint public todo;
}
