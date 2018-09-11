pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";
import "../../interfaces/PriceInterface.sol";
import "../../components/base/FeeCharger.sol";
import "../../libs/ERC20Extended.sol";

contract AsyncWithdraw is FeeCharger, WithdrawInterface {
    using SafeMath for uint256;

    string public name = "AsyncWithdraw";
    string public description = "Withdraw one by one";
    string public category = "Withdraw";
    string public version = "1.0";

    struct ContractInfo {
        uint price;
        address[]  userRequests;
        mapping (address => uint)  amountPerUser;
        uint totalWithdrawAmount;
        bool withdrawRequestLock;
    }

    mapping(address => ContractInfo ) public contracts;


    function getUserRequests() external view returns(address[]) {
        return contracts[msg.sender].userRequests;
    }

    function getTotalWithdrawAmount() external view returns(uint) {
        return contracts[msg.sender].totalWithdrawAmount;
    }

    function isInProgress() external view returns(bool) {
        return contracts[msg.sender].withdrawRequestLock &&
            contracts[msg.sender].totalWithdrawAmount > 0;
    }

    function request(address _investor, uint256 _amount) external returns (bool) {
        ERC20Extended derivative = ERC20Extended(msg.sender);
         // Safe checks
        require(contracts[msg.sender].withdrawRequestLock == false); // Cant request while withdrawing
        require(derivative.totalSupply() >= contracts[msg.sender].totalWithdrawAmount.add(_amount));
        require(derivative.balanceOf(_investor) >= _amount.add(contracts[msg.sender].amountPerUser[_investor]));
        // // Add user to the list of requesters
        if (contracts[msg.sender].amountPerUser[_investor] == 0) {
            contracts[msg.sender].userRequests.push(_investor);
        }
        contracts[msg.sender].amountPerUser[_investor] = contracts[msg.sender].amountPerUser[_investor].add(_amount);
        contracts[msg.sender].totalWithdrawAmount =  contracts[msg.sender].totalWithdrawAmount.add(_amount);

        emit WithdrawRequest(_investor, contracts[msg.sender].amountPerUser[_investor]);

        return true;
    }


    function withdraw(address _investor) external returns(uint eth, uint tokens) {
        require(payFee(0));
        require(contracts[msg.sender].withdrawRequestLock); // Only withdraw after lock

        // Jump the already withdrawed
        if(contracts[msg.sender].amountPerUser[_investor] == 0) {return(0,0);}

        ERC20Extended derivative = ERC20Extended(msg.sender);

        tokens = contracts[msg.sender].amountPerUser[_investor];

        contracts[msg.sender].totalWithdrawAmount = contracts[msg.sender].totalWithdrawAmount.sub(tokens);
        contracts[msg.sender].amountPerUser[_investor] = 0;

        // If he doesn't have this amount, the request will be closed and no ETH will be returned
        if(tokens > derivative.balanceOf(_investor)) {
            emit Withdrawed(_investor, 0, 0);
            return( 0, 0);
        }

        eth = tokens.mul( contracts[msg.sender].price).div( 10 ** derivative.decimals());
        emit Withdrawed(_investor, tokens, eth);
        return( eth, tokens);
    }

    function freeze() external {
        require(contracts[msg.sender].withdrawRequestLock == false);
        ERC20Extended derivative = ERC20Extended(msg.sender);


        uint _price = ERC20PriceInterface(msg.sender).getPrice();
        uint _derivativeEth = ERC20PriceInterface(derivative).getETHBalance();
        uint _withdrawAmount = contracts[msg.sender].totalWithdrawAmount;
        // ETH = AMOUNT*PRICE / DECIMALS
        uint _requireEther = _withdrawAmount.mul(_price).div(10 ** derivative.decimals());

        // Case we have enough ETH
        if(_requireEther <= _derivativeEth) {
            contracts[msg.sender].price = _price;
        } else {
            // Special scenario, we got not enough ETH to satisfy this price
            // PRICE = ETH*DECIMALS / AMOUNT
            contracts[msg.sender].price = _derivativeEth.mul(10 ** derivative.decimals()).div(_withdrawAmount);
        }

        contracts[msg.sender].withdrawRequestLock = true;
    }

    function finalize() external {
        contracts[msg.sender].withdrawRequestLock = false;
        contracts[msg.sender].price = 0;
        delete contracts[msg.sender].userRequests;
    }

    // Out of the interface
    function getContractInfo(address _contract) external view returns(
        uint price,
        address[]  userRequests,
        uint totalWithdrawAmount,
        bool withdrawRequestLock
     ) {
        price = contracts[_contract].price;
        userRequests = contracts[_contract].userRequests;
        totalWithdrawAmount = contracts[_contract].totalWithdrawAmount;
        withdrawRequestLock = contracts[_contract].withdrawRequestLock;
    }


    /// Out of interface
    function getWithdrawBalance(address _contract) external view returns(uint){
        return contracts[_contract].amountPerUser[msg.sender];
    }

    function getUserWithdrawBalance(address _contract, address _investor) external view returns(uint) {
        return contracts[_contract].amountPerUser[_investor];
    }

    function getTotalWithdrawAmount(address _contract) external view returns(uint){
        return contracts[_contract].totalWithdrawAmount;
    }
}
