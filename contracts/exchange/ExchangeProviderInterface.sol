pragma solidity ^0.4.17;

import "../libs/ERC20.sol";
import "./ExchangeAdapterBase.sol";

contract ExchangeProviderInterface {
    function startPlaceOrder(uint orderId, address deposit) external returns(bool);
    function addPlaceOrderItem(uint orderId, ERC20 token, uint amount, uint rate) external returns(bool);
    function endPlaceOrder(uint orderId) external payable returns(bool);
    function getSubOrderStatus(uint orderId, ERC20 token) external view returns (ExchangeAdapterBase.OrderStatus);
    function cancelOrder(uint orderId) external returns (bool success);
    function checkTokenSupported(ERC20 token) external view returns (bool);
    function buyToken(bytes32 /*id*/, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external payable returns(bool);
    function sellToken(bytes32 /*id*/, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external returns(bool);
}