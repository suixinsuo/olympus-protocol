pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";

contract SimpleWithdraw is WithdrawInterface {

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
    function start() external {return;}
    function unlock() external  {return;}
    function isInProgress() external view returns(bool) { return false; }

    function getUserRequests() external view returns(address[]) {
        return  contracts[msg.sender].userRequests;
    }

    function withdraw(address _requester) external returns(uint eth, uint tokens) {

        if(contracts[msg.sender].withdrawPending[_requester] == false) {return(0,0);}

        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        tokens = derivative.balanceOf(_requester);
        eth = (tokens * derivative.getPrice()) / 10 ** derivative.decimals();
        emit Withdrawed(_requester, derivative.balanceOf(_requester), eth);

        return (eth,tokens);
    }
}
