pragma solidity 0.4.24;

import "./SafeMath.sol";

contract Reimbursable {
    using SafeMath for uint256;

    uint public constant GAS_FEE_RANGE = 10000;
    uint public startGas;

    event LogUint(string desc, uint value);

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
    returns (uint gasToReimburse)
    {
        // 21000 is for the transfer below.
        gasToReimburse = (startGas - gasleft() + 21000) * tx.gasprice;
        msg.sender.transfer(gasToReimburse);
    }
}
