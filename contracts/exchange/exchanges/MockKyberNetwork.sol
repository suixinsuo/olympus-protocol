pragma solidity ^0.4.17;

import "../../libs/utils.sol";
import "../../libs/SimpleERC20Token.sol";

import "../../libs/ERC20.sol";

contract MockKyberNetwork {

    struct Token{
        SimpleERC20Token   token;
        uint    slippageRate;
    }
    address ETH_ADDRESS = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

    Token[] public supportedTokens;
    function MockKyberNetwork(uint total,uint _decimals) public {
        require(total <= 50 && total > 0);
        for (uint i = 0; i < total; i++) {
            supportedTokens.push(Token({
                token: new SimpleERC20Token(_decimals),
                slippageRate:10**18*1000
            }));
        }
    }

    function supportedTokens() external view returns(address[]){
        address[] memory tokens = new address[](supportedTokens.length);
        for (uint i = 0; i < supportedTokens.length; i++) {
            tokens[i] = address(supportedTokens[i].token);
        }
        return tokens;
    }

    function getExpectedRate(ERC20 src, ERC20 dest, uint srcQty) external view 
    returns (uint expectedRate, uint slippageRate)
    {
        return _getExpectedRate(src,dest,srcQty);
    }

    function _getExpectedRate(ERC20 /*src*/, ERC20 dest, uint) private view
    returns (uint expectedRate, uint slippageRate)
    {
        if (address(dest) == ETH_ADDRESS) {
            return (10 ** 15, 10 ** 15);
        } else {
            for (uint i = 0; i < supportedTokens.length; i++){
                if(address(supportedTokens[i].token) == address(dest)){
                    return (supportedTokens[i].slippageRate,supportedTokens[i].slippageRate);
                }
            }
        }
        return (0, 0);    
    }

    function trade(
        ERC20 source,
        uint srcAmount,
        ERC20 dest,
        address destAddress,
        uint ,
        uint minConversionRate,
        address )
        external payable returns(uint)
    {
        uint slippageRate;
        uint expectedRate;
        (expectedRate, slippageRate) = _getExpectedRate(source,dest,srcAmount);
        require(slippageRate>=minConversionRate);

        if (address(source) == ETH_ADDRESS) {
            require(msg.value == srcAmount);

            uint destAmount = getExpectAmount(srcAmount, dest.decimals(), minConversionRate);

            dest.transfer(destAddress,destAmount);
            return destAmount;
        } else {
            require(msg.value == 0);
            source.transferFrom(msg.sender, this, srcAmount);
            // uint ethAmount = getExpectAmount(srcAmount, 18, minConversionRate);
            uint ethAmount = Utils.calcDstQty(srcAmount, source.decimals(), 18, minConversionRate);
            destAddress.send(ethAmount);
            return ethAmount;
        }
    }

    function getExpectAmount(uint amount, uint destDecimals, uint rate) private pure returns(uint){
        return Utils.calcDstQty(amount, 18, destDecimals, rate);
    }
}