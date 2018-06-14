pragma solidity 0.4.24;

import "../libs/ERC20.sol";
import "./ComponentInterface.sol";


contract PriceProviderInterface is ComponentInterface {
    function getPrice(string _exchangeId, address _sourceAddress, address _destAddress, uint _amount) 
        external returns(uint expectedRate, uint slippageRate);
}