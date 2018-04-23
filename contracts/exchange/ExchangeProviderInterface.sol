pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./ExchangeAdapterBase.sol";

contract ExchangeProviderInterface {

    // enum MarketOrderStatus {
    //     Pending,
    //     Placed,
    //     PartiallyCompleted,
    //     Completed,
    //     Cancelled,
    //     Errored
    // }

    // function placeOrder(uint orderId, ERC20[] tokens, uint[] quantities, uint[] prices,bytes32 exchangeId, address deposit) external payable returns (bool);

    function startPlaceOrder(uint orderId, address deposit) external returns(bool);
    function addPlaceOrderItem(uint orderId, ERC20 token, uint amount, uint rate) external returns(bool);
    function endPlaceOrder(uint orderId) external payable returns(bool);

    function getSubOrderStatus(uint orderId, ERC20 token) external view returns (ExchangeAdapterBase.OrderStatus);

    function cancelOrder(uint orderId) external returns (bool success);

    function checkTokenSupported(ERC20 token) external view returns (bool);
}