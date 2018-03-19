pragma solidity ^0.4.18;

import '../libs/Ownable.sol';
import '../libs/Provider.sol';

contract ExchangeProvider is Ownable, Provider {
    event OrderStatusChanged(string orderId, MarketOrderStatus status);
    
    enum MarketOrderStatus {
        Pending,
        Placed,
        Completed,
        Cancelled,
        Errored
    }
        
    struct MarketOrder {
	    address buyer;
        ERC20Token token;
        uint quantity;
        uint timestamp;
    }
    
    function getExchanges() external returns (uint[] ids, string[] names);
    function getSupportedTokens(uint exchangeId) external returns (address[] tokenAddresses, string[] names, string[] symbols);
    function getMarketPrices(address[] tokenAddresses) external returns (uint[]);
    function placeOrder(string orderId, address[] tokenAddresses, uint[] quantities, address depositAddress) external returns (string orderId);
    function cancelOrder(string orderId) external returns (bool success);
}