pragma solidity ^0.4.24;

import "../../libs/utils.sol";
import "../../libs/ERC20.sol";

contract ExchangeAdapterBase {

    address internal exchangeExchange;

    constructor (address _exchange) public {
        exchangeExchange = _exchange;
    }

    function getExpectAmount(uint eth, uint destDecimals, uint rate) internal pure returns(uint){
        return Utils.calcDstQty(eth, 18, destDecimals, rate);
    }
}
