pragma solidity ^0.4.17;

import "./Interfaces.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

// TODO: ownable
contract ExchangeAdapterManager is Ownable {

    IExchangeAdapter[] exchanges;
    event ExchangeAdapterRegisted(address exchange);
    event ExchangeAdapterUnRegisted(address exchange);

    function ExchangeAdapterManager(IExchangeAdapter initAdatper) public {
        if(address(initAdatper) == 0x0){
            return;
        }
        registerExchange(initAdatper);
    }

    function registerExchange(address e) public onlyOwner
    returns (bool) 
    {
        require(e != 0x0);

        for(uint i = 0; i < exchanges.length; i++){
            if (e == address(exchanges[i])){
                return false;
            }
        }
        exchanges.push(IExchangeAdapter(e));
        emit ExchangeAdapterRegisted(e);
        return true;
    }

    function unregisterExchange(address e) public onlyOwner
    returns(bool success)
    {
        int foundIndex = -1;
        for (uint i = 0; i < exchanges.length; i++) {
            if(e == address(exchanges[i])){
                foundIndex = int(i);
                break;
            }
        }
        assert(foundIndex>=0);

        // TODO: make sure exchange is not working
        for(i = uint(foundIndex); i < exchanges.length - 1; i++){
            exchanges[i] = exchanges[i+1];
        }
        exchanges.length--;
        
        emit ExchangeAdapterUnRegisted(e);
        return true;
    }
   
    /// >0  : found exchangeId
    /// ==0 : not found
    function pickExchange(ERC20 token, uint amount, uint rate) external view returns (address exchange) {
        
        int maxRate = -1;
        for(uint i = 0; i < exchanges.length;  i++) {

            IExchangeAdapter e = exchanges[i];
            if(!e.isEnabled()) {
                continue;
            }

            int _rate = e.getRate(token, amount);
            if (_rate == 0) { // not support
                continue;
            }

            // TODO: fix it
            if (_rate < int(rate)){
                continue;
            }

            if (_rate >= maxRate) {
                maxRate = _rate;
                return address(e);
            }
        }
        return 0x0; 
    }

    function checkTokenSupported(ERC20 token) external view returns (bool){

        for(uint i = 0; i < exchanges.length; i++){
            if(exchanges[i].getRate(token,0)!=0){
                return true;
            }
        }
        return false;
    }
}