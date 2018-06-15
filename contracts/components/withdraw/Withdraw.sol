pragma solidity 0.4.24;

import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/DerivativeInterface.sol";

contract Withdraw is WithdrawInterface {

    function withdraw( uint _amount, uint _derivativePrice) external returns(uint) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        require(derivative.totalSupply() >= _amount);

        uint ethToReturn = (_amount * _derivativePrice) / 10 ** derivative.decimals();
        return ethToReturn;
    }
}
