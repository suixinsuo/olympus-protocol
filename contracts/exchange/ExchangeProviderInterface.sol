pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract ExchangeProviderInterface is Provider {
    event OrderStatusChanged(string orderId, MarketOrderStatus status);

    enum MarketOrderStatus {
        Pending,
        Placed,
        PartiallyCompleted,
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

    function checkTokenSupported(address tokenAddress) external view returns (bool);

    function placeOrder(
        bytes32 orderId,
        address[] tokenAddresses,
        uint[] quantities,
        uint[] prices,
        bytes32 exchangeId,
        address depositAddress)
        external returns (bool success);

    function getSubOrderStatus(bytes32 orderId, address tokenAddress) external view returns (MarketOrderStatus);

    function cancelOrder(string orderId) external returns (bool success);
    // increment statistics
    // function incrementStatistics(address id, uint amountInEther) external returns (bool success);
}
