pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";

contract SimpleWithdraw is WithdrawInterface {


    function request(address, uint) external returns(bool) {return true; }
    function start() external {return;}
    function unlock() external  {return;}
    function isInProgress() external view returns(bool) { return false; }

    function getUserRequests() external view returns(address[]) {
        address[] memory requests = new address[](1);
        return requests;
    }

    function withdraw(address _requester) external returns(uint eth, uint tokens) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        tokens = derivative.balanceOf(_requester);
        eth = (tokens * derivative.getPrice()) / 10 ** derivative.decimals();
        emit Withdrawed(_requester, derivative.balanceOf(_requester), eth);
        return (eth,tokens);
    }
}
