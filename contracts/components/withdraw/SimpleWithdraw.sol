pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";
import "../../components/base/FeeCharger.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract SimpleWithdraw is FeeCharger, WithdrawInterface {
    using SafeMath for uint256;
    struct ContractInfo {
        address[]  userRequests;
        mapping (address => bool)  withdrawPending;
    }

    mapping(address => ContractInfo ) contracts;


    function request(address _investor, uint) external returns(bool) {
        contracts[msg.sender].withdrawPending[_investor] = true;
        contracts[msg.sender].userRequests.push(_investor);
        return true;
    }
    function freeze() external {return;}
    function finalize() external  {return;}
    function isInProgress() external view returns(bool) { return false; }
    function getTotalWithdrawAmount() external view returns(uint) {return 0;}

    function getUserRequests() external view returns(address[]) {
        return  contracts[msg.sender].userRequests;
    }

    function withdraw(address _requester) external returns(uint eth, uint tokens) {
        require(payFee(0));
        if(contracts[msg.sender].withdrawPending[_requester] == false) {return(0,0);}

        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        tokens = derivative.balanceOf(_requester);
        eth = (tokens.mult(derivative.getPrice())).div(10 ** derivative.decimals());
        emit Withdrawed(_requester, derivative.balanceOf(_requester), eth);

        return (eth,tokens);
    }
}
