pragma solidity 0.4.24;

import "./DerivativeInterface.sol";
import "../libs/ERC20Extended.sol";
import "./PriceInterface.sol";



contract FundInterface is DerivativeInterface, ERC20PriceInterface {

    address[] public tokens;

    // invest, withdraw is done in transfer.
    function invest() public payable returns(bool success);


    function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
}
