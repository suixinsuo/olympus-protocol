pragma solidity ^0.4.17;

import "../libs/utils.sol";
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
        Completed,
        PartiallyCompleted,
        Cancelled,
        Errored
    }

    function ExchangeAdapterBase(address _manager,address _exchange) public {
        adapterManager = _manager;
        exchangeExchange = _exchange;
    }

    function getExpectAmount(uint eth, uint rate) internal pure returns(uint){
        // TODO: asume all token decimals is 18
        return Utils.calcDstQty(eth, 18, 18, rate);
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