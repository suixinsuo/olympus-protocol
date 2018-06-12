pragma solidity ^0.4.17;

import "../ExchangeAdapterBase.sol";
import "../../libs/ERC20.sol";
import "../ExchangePermissions.sol";

contract KyberNetwork {

    function getExpectedRate(ERC20 src, ERC20 dest, uint srcQty)
        external view returns (uint expectedRate, uint slippageRate);

    function trade(
        ERC20 source,
        uint srcAmount,
        ERC20 dest,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId)
        external payable returns(uint);
}

contract KyberNetworkExchange is ExchangeAdapterBase, ExchangePermissions {

    KyberNetwork kyber;
    bytes32 name;
    bytes32 exchangeId;
    ERC20 constant ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    uint orderId = 0;
    address walletId = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;

    struct Order{
        OrderStatus status;
        uint amount;
        uint destCompletedAmount;
    }

    Status public status;

    mapping (uint=>Order) orders;

    event PlacedOrder(uint orderId);

    constructor (KyberNetwork _kyber, address _manager,address _exchange, address _permission) public
    ExchangePermissions(_permission)
    ExchangeAdapterBase(_manager, _exchange)
    {
        require(address(_kyber) != 0x0);
        kyber = _kyber;
        status = Status.ENABLED;
    }

    function configKyberNetwork(KyberNetwork _kyber,address _walletId ) public onlyExchangeOwner {
        if(address(_kyber) != 0x0){
            kyber = _kyber;
        }
        if(_walletId != 0x0){
            walletId = _walletId;
        }
    }

    function addExchange(bytes32 _id, bytes32 _name)
    public onlyAdaptersManager returns(bool)
    {
        exchangeId = _id;
        name = _name;
        return true;
    }

    function getExchange(bytes32 /*_id*/)
    public view returns(bytes32, Status)
    {
        return (name, status);
    }

    function enable(bytes32 /*_id*/) public onlyExchangeOwner returns(bool){
        status = Status.ENABLED;
        return true;
    }

    function disable(bytes32 /*_id*/) public onlyExchangeOwner returns(bool){
        status = Status.DISABLED;
        return true;
    }

    function isEnabled(bytes32 /*_id*/) external view returns (bool success) {
        return status == Status.ENABLED;
    }
    //buy rate
    function getRate(bytes32 /*id*/, ERC20 token, uint amount) external view returns(int){
        uint expectedRate;
        uint slippageRate;
        (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, token, amount);
        return int(slippageRate);
    }
    //sell rate
    function getRateToSell(bytes32 /*id*/, ERC20 token, uint amount) external view returns(int){
        uint expectedRate;
        uint slippageRate;
        (expectedRate, slippageRate) = kyber.getExpectedRate(token, ETH_TOKEN_ADDRESS, amount);
        return int(slippageRate);
    }
    function placeOrderQuicklyToBuy(bytes32 /*id*/, ERC20 dest, uint amount, uint rate, address deposit)
    external payable returns(bool)
    {

        if (address(this).balance < amount) {
            return false;
        }
        require(msg.value == amount);
        uint expectedRate;
        uint slippageRate;

        (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, dest, amount);
        if(slippageRate < rate){
            return false;
        }

        uint beforeTokenBalance = dest.balanceOf(deposit);
        slippageRate = rate;
        /*uint actualAmount = kyber.trade.value(amount)(*/
        kyber.trade.value(msg.value)(
            ETH_TOKEN_ADDRESS,
            amount,
            dest,
            deposit,
            2**256 - 1,
            slippageRate,
            walletId);
        uint expectAmount = getExpectAmount(amount, dest.decimals(), rate);

        uint afterTokenBalance = dest.balanceOf(deposit);
        assert(afterTokenBalance > beforeTokenBalance);

        uint actualAmount = afterTokenBalance - beforeTokenBalance;
        require(actualAmount >= expectAmount);

        /**
        // Kyber Bug in Kovan that actualAmount returns always zero
        */

        if(!dest.approve(deposit, actualAmount)){
            return false;
        }
        return true;
    }
    function placeOrderQuicklyToSell(bytes32 /*id*/, ERC20 dest, uint amount, uint rate, address deposit)
    external returns(bool)
    {
        // if (address(this).balance < amount) {
        //     return false;
        // }
 
        dest.approve(address(kyber), amount);

        uint expectedRate;
        uint slippageRate;

        (expectedRate, slippageRate) = kyber.getExpectedRate(dest, ETH_TOKEN_ADDRESS, amount);
        if(slippageRate < rate){
            return false;
        }
        slippageRate = rate;
        uint beforeTokenBalance = dest.balanceOf(this);
        /*uint actualAmount = kyber.trade.value(amount)(*/
        kyber.trade(
            dest,
            amount,
            ETH_TOKEN_ADDRESS,
            deposit,
            2**256 - 1,
            slippageRate,
            walletId);

        // uint expectAmount = getExpectAmount(amount, dest.decimals(), rate);

        uint afterTokenBalance = dest.balanceOf(this);
        assert(afterTokenBalance < beforeTokenBalance);
        
        uint actualAmount = beforeTokenBalance - afterTokenBalance;
        require(actualAmount == amount);


        return true;
    }
    function placeOrder(bytes32 /*id*/, ERC20 dest, uint amount, uint rate, address deposit)
    external payable returns(uint adapterOrderId)
    {

        if (address(this).balance < amount) {
            return 0;
        }

        uint expectedRate;
        uint slippageRate;

        (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, dest, amount);
        if(slippageRate < rate){
            return 0;
        }

        uint beforeTokenBalance = dest.balanceOf(this);

        /*uint actualAmount = kyber.trade.value(amount)(*/
        kyber.trade.value(amount)(
            ETH_TOKEN_ADDRESS,
            amount,
            dest,
            this,
            2**256 - 1,
            slippageRate,
            walletId);
            
        uint expectAmount = getExpectAmount(amount, dest.decimals(), rate);

        uint afterTokenBalance = dest.balanceOf(this);
        assert(afterTokenBalance > beforeTokenBalance);

        uint actualAmount = afterTokenBalance - beforeTokenBalance;
        require(actualAmount >= expectAmount);

        /**
        // Kyber Bug in Kovan that actualAmount returns always zero
        */

        if(!dest.approve(deposit, actualAmount)){
            return 0;
        }
        orders[++orderId] = Order({
            status:OrderStatus.Approved,
            amount:amount,
            destCompletedAmount:actualAmount
        });

        emit PlacedOrder(orderId);
        return orderId;
    }

    function payOrder(uint adapterOrderId) external payable returns(bool){
        Order memory o = orders[adapterOrderId];
        if(o.status != OrderStatus.Approved){
            revert();
        }
        if(o.amount != msg.value){
            revert();
        }
        orders[adapterOrderId].status = OrderStatus.Completed;
        return true;
    }

    function cancelOrder(uint adapterOrderId) external onlyExchangeOwner returns(bool){
        Order memory o = orders[adapterOrderId];
        require(o.amount > 0);

        if(o.status != OrderStatus.Pending){
            return false;
        }

        orders[adapterOrderId].status = OrderStatus.Cancelled;
        return true;
    }

    function getOrderStatus(uint adapterOrderId) external view returns(OrderStatus){

        return orders[adapterOrderId].status;
    }

    function getDestCompletedAmount(uint adapterOrderId) external view returns(uint){

        return orders[adapterOrderId].destCompletedAmount;
    }

    function() public onlyExchangeOwner payable { }

    function withdraw(uint amount) public onlyExchangeOwner {

        require(amount <= address(this).balance);

        uint sendAmount = amount;
        if(amount==0){
            sendAmount = address(this).balance;
        }
        msg.sender.transfer(sendAmount);
    }
}
