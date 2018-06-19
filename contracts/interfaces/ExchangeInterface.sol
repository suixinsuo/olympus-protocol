pragma solidity 0.4.24;

import "../libs/ERC20.sol";
import "./ComponentInterface.sol";


contract ExchangeInterface is ComponentInterface {
    function supportsTradingPair(string _exchangeId, address _srcAddress, address _destAddress)
        external returns(bool supported);

    function buyTokens(
        string _exchangeId, ERC20[] _tokens, uint[] _amounts,
        uint[] _rates, address _depositAddress, address _partnerId
    )
        external payable
    returns(bool success);

    function sellTokens(string _exchangeId, ERC20[] _tokens,
        uint[] _amounts, uint[] _rates, address _depositAddress, address _partnerId
    )
        external
    returns(bool success);
}
