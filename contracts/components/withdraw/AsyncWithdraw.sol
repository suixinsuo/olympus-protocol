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
    string public version = "1.2-20180928";

    struct ContractInfo {
        uint price;
        address[] userRequests;
        mapping (address => uint) amountPerUser;
        address[] pendingUserRequests;
        mapping (address => uint) pendingAmountPerUser;
        uint pendingTotalWithdrawAmount;
        uint pendingTotalETHAmount;
        uint totalWithdrawAmount;
        bool withdrawRequestLock;
    }

    mapping(address => ContractInfo ) public contracts;


    function getUserRequests() external view returns(address[]) {
        if(contracts[msg.sender].pendingTotalWithdrawAmount > 0){
            return contracts[msg.sender].pendingUserRequests;
        }
        return contracts[msg.sender].userRequests;
    }

    function getTotalWithdrawAmount() external view returns(uint) {
        if(contracts[msg.sender].pendingTotalWithdrawAmount > 0){
            return contracts[msg.sender].pendingTotalWithdrawAmount;
        }
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
        require(
            derivative.balanceOf(_investor) >= _amount
            .add(contracts[msg.sender].amountPerUser[_investor])
            .add(contracts[msg.sender].pendingAmountPerUser[_investor]));
        // // Add user to the list of requesters
        if (contracts[msg.sender].amountPerUser[_investor] == 0) {
            contracts[msg.sender].userRequests.push(_investor);
        }
        contracts[msg.sender].amountPerUser[_investor] = contracts[msg.sender].amountPerUser[_investor].add(_amount);
        contracts[msg.sender].totalWithdrawAmount =  contracts[msg.sender].totalWithdrawAmount.add(_amount);

        emit WithdrawRequest(_investor, contracts[msg.sender].amountPerUser[_investor]);

        return true;
    }

    function withdraw(address _investor) external returns(uint _eth, uint _tokens) {
        require(payFee(0));
        require(contracts[msg.sender].withdrawRequestLock); // Only withdraw after lock

        // Jump the already withdrawed
        if(contracts[msg.sender].pendingAmountPerUser[_investor] == 0) {return(0,0);}

        ERC20Extended derivative = ERC20Extended(msg.sender);

        _tokens = contracts[msg.sender].pendingAmountPerUser[_investor];
        _eth = _tokens.mul(contracts[msg.sender].price).div(10 ** derivative.decimals());
        
        // If he doesn't have this amount, the request will be closed and no ETH will be returned
        if(_tokens > derivative.balanceOf(_investor)) {
            emit Withdrawed(_investor, 0, 0);
            clearInvestor(msg.sender, _investor, _tokens, _eth);
            return (0, 0);
        }

        // the last investor requested withdraw, we need to give him whats left.
        if (contracts[msg.sender].pendingAmountPerUser[_investor] == contracts[msg.sender].pendingTotalWithdrawAmount ) {
            _eth = contracts[msg.sender].pendingTotalETHAmount;
        }

        clearInvestor(msg.sender, _investor, _tokens, _eth);

        emit Withdrawed(_investor, _tokens, _eth);
        return( _eth, _tokens);
    }

    function clearInvestor(address _derivative, address _investor, uint _tokens, uint _eth) private {
        contracts[_derivative].totalWithdrawAmount = contracts[_derivative].totalWithdrawAmount.sub(_tokens);
        contracts[_derivative].pendingTotalWithdrawAmount = contracts[_derivative].pendingTotalWithdrawAmount.sub(_tokens);
        contracts[_derivative].amountPerUser[_investor] = 0;
        contracts[_derivative].pendingAmountPerUser[_investor] = 0;

        contracts[_derivative].pendingTotalETHAmount = contracts[_derivative].pendingTotalETHAmount.sub(_eth);
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
            contracts[msg.sender].pendingTotalETHAmount = _requireEther; 

        } else {
            // Special scenario, we got not enough ETH to satisfy this price
            // PRICE = ETH*DECIMALS / AMOUNT

            contracts[msg.sender].price = _derivativeEth.mul(10 ** derivative.decimals()).div(_withdrawAmount);
            contracts[msg.sender].pendingTotalETHAmount = _derivativeEth; 
        }

        contracts[msg.sender].withdrawRequestLock = true;

        uint i;
        for(i = 0; i < contracts[msg.sender].userRequests.length; i++){
            contracts[msg.sender].pendingUserRequests.push(contracts[msg.sender].userRequests[i]);
            contracts[msg.sender].pendingAmountPerUser[contracts[msg.sender].userRequests[i]] = contracts[msg.sender].
                amountPerUser[contracts[msg.sender].userRequests[i]];
            contracts[msg.sender].pendingTotalWithdrawAmount = contracts[msg.sender].pendingTotalWithdrawAmount.add(contracts[msg.sender].
                amountPerUser[contracts[msg.sender].userRequests[i]]);
        }
        delete contracts[msg.sender].userRequests;
    }

    function finalize() external {
        contracts[msg.sender].withdrawRequestLock = false;
        contracts[msg.sender].price = 0;
        delete contracts[msg.sender].pendingUserRequests;
    }

    // Out of the interface
    function getContractInfo(address _contract) external view returns(
        uint price,
        address[]  userRequests,
        uint totalWithdrawAmount,
        bool withdrawRequestLock,
        uint pendingTotalETHAmount
     ) {
        price = contracts[_contract].price;
        userRequests = contracts[_contract].userRequests;
        totalWithdrawAmount = contracts[_contract].totalWithdrawAmount;
        withdrawRequestLock = contracts[_contract].withdrawRequestLock;
        pendingTotalETHAmount = contracts[_contract].pendingTotalETHAmount;
    }


    /// Out of interface
    function getPendingTotalETHAmount(address _contract) external view returns(uint) {
        return contracts[_contract].pendingTotalETHAmount;
    }

    function getWithdrawBalance(address _contract) external view returns(uint) {
        return contracts[_contract].amountPerUser[msg.sender];
    }

    function getUserWithdrawBalance(address _contract, address _investor) external view returns(uint) {
        return contracts[_contract].amountPerUser[_investor];
    }

    function getTotalWithdrawAmount(address _contract) external view returns(uint){
        return contracts[_contract].totalWithdrawAmount;
    }
}
