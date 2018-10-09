pragma solidity 0.4.24;

import "./OlympusTutorialFund.sol";


contract OlympusTutorialFundStub is OlympusTutorialFund {
    using SafeMath for uint256;


    constructor (
      string _name,
      string _symbol,
      string _description,
      bytes32 _category,
      uint _decimals
     ) public OlympusTutorialFund(_name, _symbol, _description, _category, _decimals) {

        TRADE_INTERVAL = 0 seconds;
    }

    function setTradeInterval(uint _seconds) external {
        TRADE_INTERVAL = _seconds;
    }

}
