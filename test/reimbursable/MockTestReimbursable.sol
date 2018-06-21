pragma solidity ^0.4.23;

import "../../contracts/interfaces/ReimbursableInterface.sol";

contract MockTestReimbursable  {

    ReimbursableInterface reimbursable;
    constructor (ReimbursableInterface _reimbursable) public {
        reimbursable = _reimbursable;
    }
    // @notice Will receive any eth sent to the contract
    function () external payable {
    }

    function someFunction() public returns(uint) {

        reimbursable.startGasCalculation();
        for(uint i = 0; i < 10; i ++ ){
            emit LogNumber("Looping: ", i);
        }
        uint reimbursedAmount = reimbursable.reimburse();
        msg.sender.transfer(reimbursedAmount);
        return reimbursedAmount ;
    }

    event LogNumber(string _text, uint _number);
}
