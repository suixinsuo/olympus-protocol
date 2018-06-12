pragma solidity ^0.4.17;

import "../libs/utils.sol";
import "../libs/ERC20.sol";
import "../permission/PermissionProviderInterface.sol";

contract ExchangeAdapterBase {

    address internal adapterManager;
    address internal exchangeExchange;

    enum Status {
        ENABLED,
        DISABLED
    }

    enum OrderStatus {
        Pending,
        Approved,
        PartiallyCompleted,
        Completed,
        Cancelled,
        Errored
    }

    function ExchangeAdapterBase(address _manager,address _exchange) public {
        adapterManager = _manager;
        exchangeExchange = _exchange;
    }

    function getExpectAmount(uint eth, uint destDecimals, uint rate) internal pure returns(uint){
        return Utils.calcDstQty(eth, 18, destDecimals, rate);
    }

    modifier onlyAdaptersManager(){
        require(msg.sender == adapterManager);
        _;
    }

    modifier onlyExchangeProvider(){
        require(msg.sender == exchangeExchange);
        _;
    }
}
