pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";
import "../base/ComponentContainer.sol";
import "../../interfaces/WithdrawInterface.sol";


contract AsyncWithdraw is ComponentContainer, WithdrawInterface {

    struct ContractInfo {
        uint price;
        address[]  userRequests;
        mapping (address => bool)  withdrawPending;
        mapping (address => uint)  amountPerUser;
        uint totalWithdrawAmount;
        bool withdrawRequestLock;
    }

    mapping(address => ContractInfo ) contracts;


    function getUserRequests() external view returns(address[]) {
        return contracts[msg.sender].userRequests;
    }

    function isInProgress() external view returns(bool) {
        return contracts[msg.sender].withdrawRequestLock &&
            contracts[msg.sender].totalWithdrawAmount > 0;
    }


    function request(address _investor, uint256 _amount) external returns (bool) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
         // Safe checks
        require(contracts[msg.sender].withdrawRequestLock == false); // Cant request while withdrawing
        require(derivative.balanceOf(msg.sender) >= contracts[msg.sender].totalWithdrawAmount + _amount);
        require(derivative.balanceOf(_investor) >= _amount + contracts[msg.sender].amountPerUser[_investor]);
        // Add user to the list of requesters
        if (contracts[msg.sender].amountPerUser[_investor] == 0) {
            contracts[msg.sender].userRequests.push(_investor);
        }
        contracts[msg.sender].amountPerUser[_investor] += _amount;
        contracts[msg.sender].withdrawPending[_investor] = true;
        contracts[msg.sender].totalWithdrawAmount += _amount;

        emit WithdrawRequest(_investor, contracts[msg.sender].amountPerUser[_investor]);

        return true;
    }


    function withdraw(address _investor) external returns(uint eth, uint tokens) {
        require(contracts[msg.sender].withdrawRequestLock); // Only withdraw after lock
        // Jump the already withdrawed
        if(contracts[msg.sender].withdrawPending[_investor] == false) {return(0,0);}

        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        tokens = contracts[msg.sender].amountPerUser[_investor];
        eth = (tokens * contracts[msg.sender].price) / 10 ** derivative.decimals();

        contracts[msg.sender].totalWithdrawAmount -= tokens;
        contracts[msg.sender].amountPerUser[_investor] = 0;
        contracts[msg.sender].withdrawPending[_investor] = false;

        emit Withdrawed(_investor, tokens, eth);
        return( eth, tokens);
    }

    function start() external {
        require(contracts[msg.sender].withdrawRequestLock == false);
        contracts[msg.sender].withdrawRequestLock = true;
        contracts[msg.sender].price = DerivativeInterface(msg.sender).getPrice();
        require(contracts[msg.sender].price > 0);
    }

    function unlock() external {
        contracts[msg.sender].withdrawRequestLock = false;
        contracts[msg.sender].price = 0;
    }

    // Out of the interface
    function getContractInfo() external view returns(
        uint price,
        address[]  userRequests,
        uint totalWithdrawAmount,
        bool withdrawRequestLock
     ) {
        price = contracts[msg.sender].price;
        userRequests = contracts[msg.sender].userRequests;
        totalWithdrawAmount = contracts[msg.sender].totalWithdrawAmount;
        withdrawRequestLock = contracts[msg.sender].withdrawRequestLock;
    }

}
