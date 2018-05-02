pragma solidity ^0.4.17;

import "./Interfaces.sol";
import "./ExchangeProviderInterface.sol";
import { ExchangeAdapterBase as EAB} from "./ExchangeAdapterBase.sol";
import "./ExchangePermissions.sol";
import "../libs/utils.sol";
import { StorageTypeDefinitions as STD } from "../storage/OlympusStorage.sol";

contract ExchangeProvider is ExchangeProviderInterface, ExchangePermissions {

    IOlympusLabsCore core;
    IExchangeAdapterManager exchangeManager;

    struct MarketOrder {
        ERC20[]         tokens;
        uint[]          amounts;
        uint[]          rates;
        uint[]          destCompletedAmount;
        bytes32[]       exchanges;
        uint[]          adapterOrdersId;
        address         deposit;
        STD.OrderStatus orderStatus;
    }

    mapping (uint => MarketOrder) private orders;

    mapping (bytes32 => uint ) adapterOrders; // sha3(exchange, uint) => orderId

    mapping (uint => uint) private balances;

    function ExchangeProvider(address _exchangeManager, address _permission) public
    ExchangePermissions(_permission)
    {
        if (_exchangeManager != 0x0) {
            _setExchangeManager(_exchangeManager);
        }
    }

    function setExchangeManager(address _exchangeManager) public onlyExchangeOwner {
        _setExchangeManager(_exchangeManager);
    }

    function _setExchangeManager(address _exchangeManager) private  {
        exchangeManager = IExchangeAdapterManager(_exchangeManager);
    }

    function setCore(IOlympusLabsCore _core) public onlyExchangeOwner {
        core = _core;
        return;
    }

    modifier onlyCore(){
        require(msg.sender == address(core) || address(core) == 0x0);
        _;
    }

    modifier onlyAdapter(){
        require(exchangeManager.isValidAdapter(msg.sender));
        _;
    }

    function startPlaceOrder(uint orderId, address deposit)
    external onlyCore returns(bool)
    {

        if(orders[orderId].tokens.length > 0){
            return false;
        }

        orders[orderId] = MarketOrder({
            tokens: new ERC20[](0),
            amounts: new uint[](0),
            rates: new uint[](0),
            destCompletedAmount: new uint[](0),
            exchanges: new bytes32[](0),
            adapterOrdersId: new uint[](0),
            deposit: deposit,
            orderStatus:STD.OrderStatus.New
        });
        return true;
    }

    function addPlaceOrderItem(uint orderId, ERC20 token, uint amount, uint rate)
    external onlyCore returns(bool)
    {
        return _addPlaceOrderItem(orderId, 0, token, amount, rate);
    }

    function addPlaceOrderItemByExchangeId(uint orderId, bytes32 exchangeId, ERC20 token, uint amount, uint rate)
    external onlyCore returns(bool)
    {

        if(exchangeId == 0){
            return false;
        }
        if(exchangeManager.getExchangeAdapter(exchangeId) == 0x0){
            return false;
        }
        return _addPlaceOrderItem(orderId, exchangeId, token, amount, rate);
    }

    function _addPlaceOrderItem(uint orderId, bytes32 exchangeId, ERC20 token, uint amount, uint rate) private returns (bool){
        MarketOrder memory order = orders[orderId];
        for (uint i = 0; i < order.tokens.length; i++) {
            if(address(order.tokens[i]) == address(token)){
                return false;
            }
        }
        orders[orderId].tokens.push(token);
        orders[orderId].amounts.push(amount);
        orders[orderId].rates.push(rate);
        orders[orderId].destCompletedAmount.push(0);
        orders[orderId].exchanges.push(exchangeId);
        return true;
    }

    function endPlaceOrder(uint orderId)
    external onlyCore payable returns(bool)
    {

        if(!checkOrderValid(orderId)){
            return false;
        }
        balances[orderId] = msg.value;

        MarketOrder memory order = orders[orderId];

        for (uint i = 0; i < order.tokens.length; i++ ) {

            IExchangeAdapter adapter;
            if(order.exchanges[i] != 0){
                adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(order.exchanges[i]));
            }else{
                bytes32 exchangeId = exchangeManager.pickExchange(order.tokens[i],order.amounts[i],order.rates[i]);
                if(exchangeId == 0){
                    return false;
                }
                adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(exchangeId));
                orders[orderId].exchanges[i] = exchangeId;
                order.exchanges[i] = exchangeId;
            }

            uint adapterOrderId = adapter.placeOrder(
                order.exchanges[i],
                order.tokens[i],
                order.amounts[i],
                order.rates[i],
                this);

            if(adapterOrderId == 0){
                return false;
            }

            orders[orderId].adapterOrdersId.push(adapterOrderId);

            if(adapter.getOrderStatus(adapterOrderId) == EAB.OrderStatus.Approved){

                uint destCompletedAmount = adapter.getDestCompletedAmount(adapterOrderId);
                order.destCompletedAmount[i] = destCompletedAmount;
                if(!adapterApprovedImmediately(orderId, adapterOrderId, adapter, order.tokens[i], order.amounts[i], order.rates[i], destCompletedAmount, order.deposit)){
                    revert();
                    return false;
                }
            }
            adapterOrders[keccak256(address(adapter),adapterOrderId)] = orderId;
        }

        updateOrderStatus(orderId);
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

    function getExpectAmount(uint eth, uint destDecimals, uint rate) internal pure returns(uint){
        return Utils.calcDstQty(eth, 18, destDecimals, rate);
    }

    function adapterApprovedImmediately(uint orderId, uint adapterOrderId, IExchangeAdapter adapter, ERC20 token, uint amount, uint rate, uint destCompletedAmount, address deposit) private returns(bool){

        require(balances[orderId] >= amount);
        address owner = address(adapter);
        uint expectAmount = getExpectAmount(amount, token.decimals(), rate);
        if(expectAmount > destCompletedAmount){
            return false;
        }

        if(token.allowance(owner, this) < destCompletedAmount){
            return false;
        }

        if(!token.transferFrom(owner, deposit, destCompletedAmount)){
            return false;
        }
        balances[orderId] -= amount;
        //pay eth
        if(!adapter.payOrder.value(amount)(adapterOrderId)){
            return false;
        }
        EAB.OrderStatus status = adapter.getOrderStatus(adapterOrderId);
        return status == EAB.OrderStatus.Completed;
    }

    // owner can be msg.sender
    function adapterApproved(uint adapterOrderId, address tokenOwner, address payee, uint srcCompletedAmount, uint destCompletedAmount)
    external onlyAdapter returns (bool)
    {

        uint orderId = adapterOrders[keccak256(msg.sender, adapterOrderId)];
        if(orderId == 0){
            return false;
        }

        // TODO: validate order status
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
        require(balances[orderId] >= srcCompletedAmount);

        ERC20 token = order.tokens[i];

        uint expectAmount = getExpectAmount(srcCompletedAmount, order.tokens[i].decimals(), order.rates[i]);
        require(expectAmount >= destCompletedAmount);
        if(token.allowance(tokenOwner, this) < destCompletedAmount){
            return false;
        }

        if(!token.transferFrom(tokenOwner, order.deposit, destCompletedAmount)){
            return false;
        }
        balances[orderId] -= srcCompletedAmount;
        payee.transfer(srcCompletedAmount);

        orders[orderId].destCompletedAmount[i] += destCompletedAmount;

        updateOrderStatus(orderId);
        return true;
    }

    function updateOrderStatus(uint orderId) private returns (bool){

        MarketOrder memory order = orders[orderId];
        STD.OrderStatus status;

        uint completedTotal = 0;
        uint pendingTotal = 0;
        uint partiallyCompletedTotal = 0;
        uint erroredTotal = 0;
        uint cancelledTotal = 0;

        for(uint i = 0; i < order.adapterOrdersId.length;i++){

            IExchangeAdapter adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(order.exchanges[i]));
            EAB.OrderStatus subStatus = adapter.getOrderStatus(order.adapterOrdersId[i]);

            if (subStatus == EAB.OrderStatus.Pending) {
                pendingTotal++;
            } else if (subStatus == EAB.OrderStatus.Approved) {
                // should not go to here
            } else if (subStatus == EAB.OrderStatus.Completed) {
                completedTotal++;
            } else if (subStatus == EAB.OrderStatus.PartiallyCompleted) {
                partiallyCompletedTotal++;
            } else if (subStatus == EAB.OrderStatus.Errored) {
                erroredTotal++;
            } else if (subStatus == EAB.OrderStatus.Cancelled) {
                cancelledTotal++;
            }
        }

        if (completedTotal == order.adapterOrdersId.length){
            status = STD.OrderStatus.Completed;
        } else if (erroredTotal == order.adapterOrdersId.length){
            status = STD.OrderStatus.Errored;
        } else if (pendingTotal == order.adapterOrdersId.length){
            status = STD.OrderStatus.Placed;
        } else {
            status = STD.OrderStatus.PartiallyCompleted;
        }

        if (address(core) != 0x0){
            if(status != order.orderStatus){
                require(core.updateOrderStatus(orderId, status));
                orders[orderId].orderStatus = status;
            }
        }
        return true;
    }

    function cancelOrder(uint orderId)
    external onlyCore returns (bool success) {

        MarketOrder memory order = orders[orderId];
        require(order.tokens.length > 0);

        // those order status cann't cancel
        require(order.orderStatus != STD.OrderStatus.Completed);
        require(order.orderStatus != STD.OrderStatus.Cancelled);
        require(order.orderStatus != STD.OrderStatus.Errored);

        uint i = 0;
        for(i = 0; i < order.tokens.length; i++) {
            IExchangeAdapter adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(order.exchanges[i]));
            adapter.cancelOrder(order.adapterOrdersId[i]);
        }

        if (address(core) != 0x0){
            core.updateOrderStatus(orderId, STD.OrderStatus.Cancelled);
        }
        return true;
    }

    event LogAddress(string desc, address addr);
    event LogBytes32(string desc, bytes32 value);
    event LogUint(string desc, uint value);

    function getSubOrderStatus(uint orderId, ERC20 token) external view returns (EAB.OrderStatus){

        MarketOrder memory order = orders[orderId];

        bool found = false;
        for(uint i = 0; i < order.tokens.length; i++){
            if(address(order.tokens[i]) == address(token)){
                found = true;
                break;
            }
        }
        require(found);

        IExchangeAdapter adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(order.exchanges[i]));
        EAB.OrderStatus status = EAB.OrderStatus(adapter.getOrderStatus(order.adapterOrdersId[i]));
        return status;
    }

    function checkTokenSupported(ERC20 token) external view returns (bool){
        require(address(token) != 0x0);
        return exchangeManager.checkTokenSupported(token);
    }
}
