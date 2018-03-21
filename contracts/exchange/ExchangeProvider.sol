pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";
import "./ExchangeAdapter.sol";

import "./ExchangeProviderInterface.sol";


contract ExchangeProvider is ExchangeProviderInterface {

    uint public constant EXCHANGE_ID_OFFSET = 1000;
    ExchangeAdapter[] public exchanges;
    mapping (uint=>uint) public balance; // orderId => eth

    event OrderStatusChanged(string orderId, MarketOrderStatus status);
    
    struct OrderInfo {
        address         deposit;
        MarketOrder[]   orders;
    }    

    mapping (uint => OrderInfo) public orders;

    function cancelOrder(uint orderId) external view returns (bool success) {
        OrderInfo memory orderInfo = orders[orderId];
        require(orderInfo.deposit != 0x0);
        // if(orderInfo.status)
        return false;
    }      

    // it seems doesn't need it currently
    // function getExchanges() external returns (uint[] ids, string[] names);
    function getSupportedTokens(uint exchangeId) external returns (
        address[] tokenAddresses, 
        string[] names, 
        string[] symbols
    ) {
        require(exchangeId >= EXCHANGE_ID_OFFSET);
        uint index = _getExchangeIndex(exchangeId);
        require(index < exchanges.length);
        ExchangeAdapter e = exchanges[index];
        if (!e.isEnabled()) {
            return;
        }
        // TODO
        return;
    }      

    // function getMarketPrices(address[] tokenAddresses) external returns (uint[]){}
    function placeOrder(uint orderId, address[] tokenAddresses, uint[] amount, uint[] rates, address deposit)
        external payable returns (bool success) 
    {

        // make sure all token exchange are supported

        // check valid params
        require(tokenAddresses.length > 0);
        require(tokenAddresses.length == amount.length);
        require(tokenAddresses.length == rates.length);
        
        uint total;
        for (uint i = 0; i < amount.length; i++) {
            total += amount[i];
        }
        require(total == msg.value);

        uint[] memory choosedExchangesIndex = new uint[](tokenAddresses.length);

        // choose a exchange to placeorder based on the price
        for (i = 0; i < tokenAddresses.length; i++) {
            uint exchangeIndex;
            bool found;
            (exchangeIndex, found) = _pickExchange(tokenAddresses[i], rates[i]);
            if (!found) {
                return false;
            }
            choosedExchangesIndex[i] = exchangeIndex;
        }

        MarketOrder[] memory marketOrders = new MarketOrder[](tokenAddresses.length);
        for (i = 0; i < choosedExchangesIndex.length; i++) {
            ExchangeAdapter e = exchanges[choosedExchangesIndex[i]];
            if (!e.placeOrder(orderId, 0x0, tokenAddresses[i], amount[i], rates[i], deposit)) {
                revert();
                return false;
            }

            MarketOrder memory order = MarketOrder({
                token: tokenAddresses[i],
                quantity: amount[i],
                rate: rates[i],
                timestamp: now,
                exchangeId: _makeExchangeId(choosedExchangesIndex[i]),
                status: MarketOrderStatus.Pending
            });
            marketOrders[i] = order;
        }
        orders[orderId] = OrderInfo(deposit, marketOrders);
        return true;
    }

    function registerExchange(ExchangeAdapter e) public onlyOwner returns (uint exchangeId) {
        require(address(e) != 0);
        for (uint i = 0; i < exchanges.length; i++) {
            if (e == exchanges[i]) {
                return 0;
            }
        }
        exchangeId = _makeExchangeId(exchanges.length);
        exchanges.push(e);
        return  exchangeId;
    }    

    function _makeExchangeId(uint index) private view returns(uint) {
        return index + EXCHANGE_ID_OFFSET;
    }

    function _getExchangeIndex(uint id) private returns(uint) {
        return id - EXCHANGE_ID_OFFSET;
    }

    function _pickExchange(address token, uint rate) private view returns (uint exchangeIndex, bool found) {
        
        int maxRate = -1;
        int index = -1;
        
        for (uint i = 0; i < exchanges.length; i++) {
            int _rate = exchanges[i].getRate(token);
            if (_rate == 0) {
                continue;
            }
            if (_rate >= maxRate) {
                maxRate = _rate;
                index = int(i);        
            }
        }
        
        if (index == -1) {
            found = false;
            return;
        }

        exchangeIndex = uint(index);
        found = true;
        return; 
    }    
}