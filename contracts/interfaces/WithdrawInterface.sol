pragma solidity ^0.4.23;

import "./ComponentInterface.sol";


contract WithdrawInterface is ComponentInterface { 
    function calcWithdrawal() external returns(uint amount);
}