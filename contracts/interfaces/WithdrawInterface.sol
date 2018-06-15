pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WithdrawInterface is ComponentInterface {
    function withdraw(address _investor, uint _amount, uint _derivativePrice) external returns(uint amount);
}
