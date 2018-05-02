pragma solidity ^0.4.17;

import "./ExchangeProvider.sol";
import { StorageTypeDefinitions as STD } from "../storage/OlympusStorage.sol";

contract ExchangeProviderWrap {
  
    ExchangeProvider provider;
    
    function ExchangeProviderWrap(ExchangeProvider _p) public {
        provider = _p;    
    }
    
    function buy(uint orderId, ERC20[] tokenAddresses, uint[] amounts, uint[] rates, address deposit) public payable returns(bool){
        
        require(provider.startPlaceOrder(orderId,deposit));
        for(uint i = 0; i < tokenAddresses.length; i++){
            require(provider.addPlaceOrderItem(orderId,tokenAddresses[i],amounts[i],rates[i]));
        }
        require(provider.endPlaceOrder.value(msg.value)(orderId));
    }

    event OrderStatusUpdated(uint orderId, STD.OrderStatus status);

    function updateOrderStatus(uint orderId, STD.OrderStatus status) external returns(bool){
        emit OrderStatusUpdated(orderId,status);
        return true;
    }
}
