pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract ExchangeProviderInterface is Provider {
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
        string[] symbols);

    function getMarketPrices(address[] tokenAddresses) external returns (uint[]);

    function placeOrder(
        bytes32 orderId, 
        address[] tokenAddresses, 
        uint[] quantities, 
        uint[] prices, 
        address depositAddress) 
        external returns (bool success);
    
    function cancelOrder(string orderId) external returns (bool success);

    // only allow core to call this.
    function approve(address tokenAddress, uint minimumAmount) external returns (bool success);

    // increment statistics
    // function incrementStatistics(address id, uint amountInEther) external returns (bool success);    
}