pragma solidity ^0.4.23;

import "./SafeMath.sol";
import "./ERC20.sol";

contract Reimbursable {
    using SafeMath for uint256;

    uint public constant GAS_FEE_RANGE = 0.0002 ether;
    uint public startGas;

    modifier checkIfReimbursable() {
        require(startGas > 0);
        require(gasleft() >= GAS_FEE_RANGE);
        _;
    }

    // this should be called at the beginning of a function.
    // such as rebalance and withdraw.
    function startGasCalculation() internal {
        startGas = gasleft();
    }

    // this should be called at the last moment of the function.
    function reimburse() 
        internal 
        checkIfReimbursable() 
    {
        tx.origin.transfer(startGas - gasleft());
    }
}