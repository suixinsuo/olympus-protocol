pragma solidity ^0.4.17;

import "../ExchangeAdapter.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

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

contract KyberNetworkExchange is ExchangeAdapter {

    KyberNetwork kyber;
    ERC20 constant ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    uint orderId = 0;

    struct Order{
        OrderStatus status;
        uint amount;
    }

    mapping (uint=>Order) orders;

    event PlacedOrder(uint orderId);

    function KyberNetworkExchange(KyberNetwork _kyber) public{
        require(address(_kyber) != 0x0);
        kyber = _kyber;
        status = Status.ENABLED;
    }

    function getRate(ERC20 token, uint amount) external view returns(int){
        uint expectedRate;
        uint slippageRate;
        (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, token, amount);
        return int(slippageRate);
    }
    
    function placeOrder(ERC20 dest, uint amount, uint rate, address deposit) external payable returns(uint adapterOrderId){
        
        if (address(this).balance < amount) {
            return 0;
        }

        uint expectedRate;
        uint slippageRate;

        (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, dest, amount);
        if(slippageRate < rate){
            return 0;
        }

        /*uint actualAmount = kyber.trade.value(amount)(*/
        kyber.trade.value(amount)(
            ETH_TOKEN_ADDRESS,
            amount,
            dest,
            this,
            2**256 - 1,
            slippageRate,
            0x0);
        uint expectAmount = getExpectAmount(amount, rate);
        
        /** 
        // Kyber Bug in Kovan that actualAmount returns always zero
        // require(actualAmount > expectAmount);
        */
        
        if(!dest.approve(deposit, expectAmount)){
            return 0;
        }
        orders[++orderId] = Order({
            status:OrderStatus.Approved,
            amount:amount
        });
        emit PlacedOrder(orderId);
        return orderId;
    }

    function payOrder(uint adapterOrderId) external payable returns(bool){
        Order memory o = orders[adapterOrderId];
        if(o.status != OrderStatus.Approved){
            revert();
            return false;
        }
        if(o.amount != msg.value){
            revert();
            return false;
        }
        orders[adapterOrderId].status = OrderStatus.Completed;
        return true;
    }

    function getExpectAmount(uint amount, uint rate) private pure returns(uint){
         
        return calcDstQty(amount, 18, 18, rate);
    }

    function cancelOrder(uint adapterOrderId) external returns(bool){
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
    
    function() public onlyOwner payable { }
    
    function withdrawl() public onlyOwner {
        owner.transfer(address(this).balance);
    }
}