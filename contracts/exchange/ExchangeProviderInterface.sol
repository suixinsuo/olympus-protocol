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

    function getSubOrderStatus(uint orderId, address tokenAddress) external view returns (MarketOrderStatus);

    function cancelOrder(uint orderId) external returns (bool success);
    // increment statistics
    // function incrementStatistics(address id, uint amountInEther) external returns (bool success);

    function startPlaceOrder(uint orderId, address deposit) external returns(bool);
    function addPlaceOrderItem(uint orderId, address token,uint amount,uint rate) external returns(bool);
    function endPlaceOrder(uint orderId) external payable returns(bool);

}
