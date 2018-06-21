pragma solidity 0.4.24;

import "./DerivativeInterface.sol";
import "../libs/ERC20Extended.sol";


contract FundInterface is DerivativeInterface {
    function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool);
}
