pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/ReimbursableInterface.sol";

contract Reimbursable is  ReimbursableInterface {

    string public name = "Reiumbursable";
    string public description = "Calculate gas not used in order to pay back to the sender";
    string public category="Base";
    string public version="1.0";

    using SafeMath for uint256;

    uint public constant GAS_FEE_RANGE = 10000;
    mapping(address => uint) public startGas;
    mapping(address => bool) public lock;

    event LogUint(string desc, uint value);

    modifier checkIfReimbursable() {
        require(lock[msg.sender]);
        require(startGas[msg.sender] > 0);
        require(gasleft() >= GAS_FEE_RANGE);
        require(address(msg.sender).balance > 0);
        _;
    }
    // this should be called at the beginning of a function.
    // such as rebalance and withdraw.
    function startGasCalculation() external {
        require(!lock[msg.sender]);
        require(address(msg.sender).balance > 0);

        startGas[msg.sender] = gasleft();
        lock[msg.sender] = true;
    }

    // this should be called at the last moment of the function.
    function reimburse() external checkIfReimbursable() returns (uint)
    {
        // 21000 is for the transfer below.
        uint gasToReimburse = (startGas[msg.sender] - gasleft() + 21000) * tx.gasprice;
        require(address(msg.sender).balance >= gasToReimburse);

        // Reset
        lock[msg.sender] = false;
        startGas[msg.sender] = 0;

        return gasToReimburse;
    }

}
