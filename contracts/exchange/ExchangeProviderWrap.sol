pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./ExchangeProvider.sol";

// for test
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
}