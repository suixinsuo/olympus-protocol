pragma solidity ^0.4.24;

import "../ExchangeAdapterBase.sol";
import "../../../libs/ERC20.sol";

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

contract KyberNetworkExchange is ExchangeAdapterBase {

    KyberNetwork kyber;
    bytes32 exchangeId;
    bytes32 name;
    ERC20 constant ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    address walletId = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;

    struct Order{
        uint amount;
        uint destCompletedAmount;
    }

    bool public adapterEnabled;

    constructor (KyberNetwork _kyber) public {
        require(address(_kyber) != 0x0);
        kyber = _kyber;
        adapterEnabled = true;
    }

    function setExchangeDetails(bytes32 _id, bytes32 _name)
    public /* TODO modifier */returns(bool)
    {
        exchangeId = _id;
        name = _name;
        return true;
    }


    function getExchange(bytes32 /*_id*/)
    public view returns(bytes32, bool)
    {
        return (name, adapterEnabled);
    }


    function configKyberNetwork(KyberNetwork _kyber,address _walletId) public /* TODO modifier */ {
        if(address(_kyber) != 0x0){
            kyber = _kyber;
        }
        if(_walletId != 0x0){
            walletId = _walletId;
        }
    }

    function enable(bytes32 /*_id*/) public /* TODO modifier */ returns(bool){
        adapterEnabled = true;
        return true;
    }

    function disable(bytes32 /*_id*/) public /* TODO modifier */ returns(bool){
        adapterEnabled = false;
        return true;
    }

    function isEnabled(bytes32 /*_id*/) external view returns (bool success) {
        return adapterEnabled;
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

    function() public /* TODO modifier */ payable { }

    function withdraw(uint amount) public /* TODO modifier */ {

        require(amount <= address(this).balance);

        uint sendAmount = amount;
        if(amount==0){
            sendAmount = address(this).balance;
        }
        msg.sender.transfer(sendAmount);
    }
    event LogN( uint number, string text);

    event LogA( address Address, string text);
    event LogB( bytes32 Bytes, string text);
    event LogS( string text);

}
