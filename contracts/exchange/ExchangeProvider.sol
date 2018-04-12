pragma solidity ^0.4.17;

import "./Interfaces.sol";
import "./ExchangeProviderInterface.sol";
import "./ExchangeAdapterBase.sol";
import "../libs/utils.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ExchangeProvider is ExchangeProviderInterface, ExchangeAdapterBase, Utils, Ownable {


    IMarketOrderCallback marketOrderCallback;

    IExchangeAdapterManager exchangeManager;

    struct MarketOrder {
        ERC20[]                 tokens;
        uint[]                  amounts; // TODO:optional
        uint[]                  rates; // TODO:optional
        IExchangeAdapter[]      exchanges;
        uint[]                  adapterOrdersId;
        address                 deposit;
        MarketOrderStatus       orderStatus;
    }

    mapping (uint => MarketOrder) public orders;

    mapping (bytes32 => uint ) adapterOrders; // sha3(exchange, uint) => orderId

    mapping (uint => uint) public balances;

    function ExchangeProvider(address _exchangeManager) public {
        exchangeManager = IExchangeAdapterManager(_exchangeManager);
    }

    function setMarketOrderCallback(IMarketOrderCallback _callback) public {
        marketOrderCallback = _callback;
        return;
    }
    
    function startPlaceOrder(uint orderId, address deposit) external returns(bool){
        
        if(orders[orderId].tokens.length > 0){
            return false;
        }
        
        orders[orderId] = MarketOrder({
            tokens: new ERC20[](0),
            amounts: new uint[](0),
            rates: new uint[](0),
            exchanges: new IExchangeAdapter[](0),
            adapterOrdersId: new uint[](0),
            deposit: deposit,
            orderStatus:MarketOrderStatus.Pending
        });
        return true;
    }
    
    function addPlaceOrderItem(uint orderId, ERC20 token, uint amount, uint rate) external returns(bool){
        MarketOrder memory order = orders[orderId];
        for (uint i = 0; i < order.tokens.length; i++) {
            if(address(order.tokens[i]) == address(token)){
                return false;
            }
        }
        orders[orderId].tokens.push(token);
        orders[orderId].amounts.push(amount);
        orders[orderId].rates.push(rate);
        return true;
    }
    
    function endPlaceOrder(uint orderId) external payable returns(bool) {
        
        if(!checkOrderValid(orderId)){
            return false;
        }
        balances[orderId] = msg.value;
        
        MarketOrder memory order = orders[orderId];
        IExchangeAdapter[] memory choosedExchanges = _pickExchanges(order.tokens, order.amounts, order.rates);

        for(uint i = 0; i < choosedExchanges.length; i++) {

            uint adapterOrderId = choosedExchanges[i].placeOrder(
                order.tokens[i], 
                order.amounts[i], 
                order.rates[i], 
                this);

            if(adapterOrderId == 0){
                revert();
                return false;
            }
            orders[orderId].exchanges.push(choosedExchanges[i]);
            orders[orderId].adapterOrdersId.push(adapterOrderId);

            if(choosedExchanges[i].getOrderStatus(adapterOrderId) == int(OrderStatus.Approved)){
                if(!adapterApprovedImmediately(orderId, adapterOrderId, choosedExchanges[i], order.tokens[i], order.amounts[i], order.rates[i], order.deposit)){
                    revert();
                    return false;
                }
            }
        }
        
        // orders[orderId].orderStatus = MarketOrderStatus.Completed;
        return true;
    }
    
    function checkOrderValid(uint orderId) private view returns(bool) {
        
        uint total = 0;
        MarketOrder memory order = orders[orderId];
        if(order.tokens.length == 0){
            return false;
        }
        for(uint i = 0; i < order.amounts.length; i++ ){
            total += order.amounts[i];
        }
        if(total != msg.value){
            return false;
        }
        return true;
    }
    
    function adapterApprovedImmediately(uint orderId, uint adapterOrderId, IExchangeAdapter exchange, ERC20 token, uint amount, uint rate, address deposit) private returns(bool){

        address owner = address(exchange);
        uint expectAmount = getExpectAmount(amount, rate);
        if(token.allowance(owner, this) < expectAmount){
            return false;
        }
        if(!token.transferFrom(owner, deposit, expectAmount)){
            return false;
        }
        balances[orderId] -= amount;
        // pay eth
        if(!exchange.payOrder.value(amount)(adapterOrderId)){
            return false;
        }
        int status = exchange.getOrderStatus(adapterOrderId); 
        return status == int(OrderStatus.Completed);
    }

    // owner可以直接是msg.sender
    // TODO: only to be called by adapters
    function adapterApproved(uint adapterOrderId, address owner) external returns (bool){

        uint orderId = adapterOrders[keccak256(msg.sender, adapterOrderId)];
        if(orderId==0){
            return false;
        }

        MarketOrder memory order = orders[orderId];
        bool found = false;
        for(uint i = 0; i < order.adapterOrdersId.length; i++){
            if(order.adapterOrdersId[i] == adapterOrderId){
                found = true;
                break;
            }
        }
        if (!found){
            return false;
        }

        ERC20 token = order.tokens[i];

        uint expectAmount = getExpectAmount(order.amounts[i], order.rates[i]);
        if(token.allowance(owner, order.deposit) < expectAmount){
            return false;
        }

        if(!token.transferFrom(owner, order.deposit, expectAmount)){
            return false;
        }
        balances[orderId] -= order.amounts[i];

        msg.sender.transfer(order.amounts[i]);

        checkMarketOrderStatus(adapterOrderId);
        return true;
    }

    function getExpectAmount(uint eth, uint rate) private pure returns(uint){
        // TODO: asume all token decimals is 18
        return calcDstQty(eth, 18, 18, rate);
    }

    function checkMarketOrderStatus(uint orderId) private returns (bool){

        MarketOrder memory order = orders[orderId];
        for(uint i = 0; i < order.adapterOrdersId.length;i++){
            // TODO: define 1 as done, including completed,failed,cancelled,etc.
            if(order.exchanges[i].getOrderStatus(order.adapterOrdersId[i])!=1){
                return false;
            }
        }
        // all adapters order done,let's notify core smart contract;
        if (address(marketOrderCallback) != 0x0){
            marketOrderCallback.MarketOrderStatusUpdated(orderId, 1);
        }
        
        return true;
    }

    function _pickExchanges(ERC20[] tokens,uint[] amounts, uint[] rates) private view returns(IExchangeAdapter[]){

        IExchangeAdapter[] memory choosedExchanges = new IExchangeAdapter[](tokens.length);

        uint i = 0;
        // choose a exchange to placeorder based on the price
        for(i = 0; i < tokens.length; i++) {
            address exchange = exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]);
            if (exchange == 0x0) {
                return new IExchangeAdapter[](0);
            }
            choosedExchanges[i] = IExchangeAdapter(exchange);
        }
        return choosedExchanges;
    }

    function cancelOrder(uint orderId) external returns (bool success) {
        
        MarketOrder memory order = orders[orderId];
        require(order.tokens.length > 0);
        require(order.orderStatus == MarketOrderStatus.Pending);

        uint i = 0;
        for(i = 0; i < order.tokens.length; i++) {
            order.exchanges[i].cancelOrder(order.adapterOrdersId[i]);
        }
        return true;
    }

    function getSubOrderStatus(uint orderId, ERC20 token) external view returns (MarketOrderStatus){
        
        MarketOrder memory order = orders[orderId];
        
        bool found = false;
        for(uint i = 0; i < order.tokens.length; i++){
            if(address(order.tokens[i]) == address(token)){
                found = true;
                break;
            }
        }
        require(found);

        OrderStatus status = OrderStatus(order.exchanges[i].getOrderStatus(order.adapterOrdersId[i]));
        if (status == OrderStatus.Pending || status == OrderStatus.Approved) {
            return MarketOrderStatus.Pending;
        } else if (status == OrderStatus.Completed) {
            return MarketOrderStatus.Completed;
        } else if (status == OrderStatus.Cancelled) {
            return MarketOrderStatus.Cancelled; 
        } else {
            return MarketOrderStatus.Errored;
        }
    }

    function checkTokenSupported(ERC20 token) external view returns (bool){
        require(address(token) != 0x0);
        return exchangeManager.checkTokenSupported(token);
    }
}