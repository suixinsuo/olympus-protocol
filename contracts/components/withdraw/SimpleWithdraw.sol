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

    function withdraw(address _requester) external returns(uint) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        uint ethToReturn = (derivative.balanceOf(_requester) * derivative.getPrice()) / 10 ** derivative.decimals();
        emit Withdrawed(_requester, ethToReturn);
        return ethToReturn;
    }
}
