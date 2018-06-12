pragma solidity ^0.4.17;

import "../Interfaces.sol";
import "../ExchangeAdapterBase.sol";
import "../ExchangePermissions.sol";

contract CentralizedExchange is ExchangeAdapterBase, ExchangePermissions {

    IAdapterOrderCallback adapterOrderCallback;

    struct Order {
        OrderStatus status;
        ERC20       dest;
        uint        amount;
        uint        rate;
        uint        completed;
        uint        destCompletedAmount;
        address     deposit;
        bytes32     exchangeId;
    }

    struct Exchange {
        bytes32  name;
        Status   status;
    }
    mapping (bytes32=>Exchange) exchanges;
    mapping (bytes32=>mapping (address=>int)) rates;
    mapping (uint => Order) orders;
    uint orderId = 1000000;

    constructor (address _manager, address _exchange, address _permission) public
    ExchangePermissions(_permission)
    ExchangeAdapterBase(_manager,_exchange)
    {
    }

    function setAdapterOrderCallback(IAdapterOrderCallback _callback)
    public onlyExchangeOwner
    {
        adapterOrderCallback = _callback;
    }

    function addExchange(bytes32 _id, bytes32 _name) onlyAdaptersManager
    public returns(bool)
    {
        require(!isEmpty(_name));
        require(isEmpty(exchanges[_id].name));

        exchanges[_id] = Exchange({
            name:_name,
            status:Status.ENABLED // default is ENABLED
        });
        return true;
    }

    function getExchange(bytes32 _id)
    public view returns(bytes32, Status)
    {
        Exchange memory e = exchanges[_id];
        require(!isEmpty(e.name));
        return (e.name, e.status);
    }

    function enable(bytes32 _id) public onlyExchangeOwner returns(bool){
        require(!isEmpty(exchanges[_id].name));
        exchanges[_id].status = Status.ENABLED;
        return true;
    }

    function disable(bytes32 _id) public onlyExchangeOwner returns(bool){
        require(!isEmpty(exchanges[_id].name));
        exchanges[_id].status = Status.DISABLED;
        return true;
    }

    function _isEnabled(bytes32 _id) private view returns(bool success){
        require(!isEmpty(exchanges[_id].name));
        return exchanges[_id].status == Status.ENABLED;
    }

    function isEnabled(bytes32 _id) external view returns (bool success) {
        return _isEnabled(_id);
    }

    function isEmpty(bytes32 str) private pure returns(bool){
        return str == 0;
    }

    function setRates(bytes32 exchangeId, ERC20[] tokens, int[] _rates)
    external onlyExchangeOwner returns(bool)
    {
        require(_isEnabled(exchangeId));
        for(uint i = 0; i < tokens.length; i++){
            rates[exchangeId][address(tokens[i])] = _rates[i];
        }
        return true;
    }

    function getRate(bytes32 id, ERC20 token, uint /*amount*/) external view returns(int){
        return rates[id][address(token)];
    }

    event PlacedOrder(bytes32 exchangeId, uint orderId);

    function placeOrder(bytes32 exchangeId, ERC20 dest, uint amount, uint rate, address deposit)
    external payable returns(uint adapterOrderId)
    {
        require(_isEnabled(exchangeId));
        require(address(dest) != 0x0);
        require(amount > 0);
        require(rate > 0);
        require(deposit != 0x0);

        adapterOrderId = orderId++;
        orders[adapterOrderId] = Order({
            status:OrderStatus.Pending,
            amount:amount,
            dest:dest,
            rate:rate,
            completed:0,
            destCompletedAmount:0,
            deposit:deposit,
            exchangeId:exchangeId
        });

        emit PlacedOrder(exchangeId, adapterOrderId);
        return;
    }

    // - If buy success, the owner should approved exchange provider to transfer and this method will callback exchange provider
    // to transfer token from owner to user and then send ether to owner.
    function PlaceOrderCompletedCallback(bytes32 /*exchangeId*/, address tokenOwner, address payee, uint adapterOrderId, uint srcCompletedAmount, uint destCompletedAmount)
    public returns(bool)
    {

        require(isValidOrder(adapterOrderId));
        Order memory order = orders[adapterOrderId];
        require(srcCompletedAmount <= order.amount);
        require((srcCompletedAmount + order.completed) <= order.amount);
        require(order.status == OrderStatus.Pending);

        uint expectDestAmount = getExpectAmount(srcCompletedAmount, order.dest.decimals(), order.rate);
        require(destCompletedAmount >= expectDestAmount);
        require(order.dest.allowance(tokenOwner, order.deposit) >= destCompletedAmount);

        orders[adapterOrderId].completed += srcCompletedAmount;
        orders[adapterOrderId].status = OrderStatus.Approved;
        orders[adapterOrderId].destCompletedAmount += destCompletedAmount;

        uint beforeBalance = payee.balance;
        require(adapterOrderCallback.adapterApproved(adapterOrderId, tokenOwner, payee, srcCompletedAmount, destCompletedAmount));
        require((payee.balance - beforeBalance) == srcCompletedAmount);

        if(orders[adapterOrderId].completed == orders[adapterOrderId].amount){
            orders[adapterOrderId].status = OrderStatus.Completed;
        }else{
            orders[adapterOrderId].status = OrderStatus.PartiallyCompleted;
        }
        return true;
    }

    function isValidOrder(uint adapterOrderId) private view returns(bool){
        return address(orders[adapterOrderId].dest) != 0x0;
    }

    function getOrderStatus(uint adapterOrderId) external view returns(OrderStatus){

        return orders[adapterOrderId].status;
    }

    function getDestCompletedAmount(uint adapterOrderId) external view returns(uint){

        return orders[adapterOrderId].destCompletedAmount;
    }

    function getOrderInfo(uint adapterOrderId) public view
    returns(OrderStatus status, ERC20 dest, uint amount, uint rate, uint completed, address deposit, bytes32 exchangeId)
    {
        Order memory o = orders[adapterOrderId];
        return (o.status,o.dest,o.amount,o.rate,o.completed,o.deposit,o.exchangeId);
    }
}
