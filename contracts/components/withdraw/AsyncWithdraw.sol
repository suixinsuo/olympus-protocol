pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";

contract AsyncWithdraw {

    address[] userRequests;
    mapping (address => uint)  amountPerUser;
    uint totalWithdrawAmount;
    bool withdrawRequestLock;

    function requestWithdraw(address _investor, uint256 _amount) external returns (uint) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        // Safe checks
        require(withdrawRequestLock == false); // Cant request while withdrawing
        require(derivative.totalSupply() >= totalWithdrawAmount + _amount);
        require(derivative.balanceOf(_investor) >= _amount + amountPerUser[_investor]);
        // Add user to the list of requesters
        if (amountPerUser[_investor] == 0) {
            userRequests.push(_investor);
        }
        amountPerUser[_investor] += _amount;
        totalWithdrawAmount += _amount;
        return  amountPerUser[_investor];
    }


    function withdraw(address _investor, uint _derivativePrice) external returns(uint) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        uint ethToReturn = (amountPerUser[_investor] * _derivativePrice) / 10 ** derivative.decimals();

        totalWithdrawAmount -= amountPerUser[_investor];
        amountPerUser[_investor] = 0;
        return ethToReturn;
    }
}
