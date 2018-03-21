pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract ExchangeProviderInterface is Provider, Ownable {
    event OrderStatusChanged(string orderId, MarketOrderStatus status);
    
    enum MarketOrderStatus {
        Pending,
        Placed,
        Completed,
        Cancelled,
        Errored
    }

    struct MarketOrder {
        address token;
        uint quantity;
        uint rate;
        uint timestamp;
        uint exchangeId;
        MarketOrderStatus status;
    }

    function getExchanges() external returns (uint[] ids, string[] names);

    function getSupportedTokens(uint exchangeId) external returns (
        address[] tokenAddresses, 
        string[] names, 
        string[] symbols
    );

    function getMarketPrices(address[] tokenAddresses) external returns (uint[]);

    function placeOrder(string orderId, address[] tokenAddresses, 
        uint[] quantities, address depositAddress) external returns (string);
    
    function cancelOrder(string orderId) external returns (bool success);
}