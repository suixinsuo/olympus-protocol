pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/FundInterface.sol";


contract MockFund is FundInterface, MockDerivative {
    uint public todo;
    function buyTokens(string _exchangeId, ERC20[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool success);

    function sellTokens(string _exchangeId, ERC20[] _tokens, uint[] _amounts, uint[] _rates)
        public returns(bool success);
}
