pragma solidity ^0.4.17;

import "../../libs/utils.sol";
import "../../libs/SimpleERC20Token.sol";

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockKyberNetwork is Utils {

    struct Token{
        SimpleERC20Token   token;
        uint    slippageRate;
    }

    Token[] public supportedTokens;
    function MockKyberNetwork(uint total) public {
        require(total <= 50 && total > 0);
        for (uint i = 0; i < total; i++) {
            supportedTokens.push(Token({
                token: new SimpleERC20Token(),
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
        for (uint i = 0; i < supportedTokens.length; i++){
            if(address(supportedTokens[i].token) == address(dest)){
                return (supportedTokens[i].slippageRate,supportedTokens[i].slippageRate);
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

        require(msg.value == srcAmount);
        uint slippageRate;
        uint expectedRate;
        (expectedRate, slippageRate) = _getExpectedRate(source,dest,srcAmount);

        require(slippageRate>=minConversionRate);
        uint destAmount = getExpectAmount(srcAmount,minConversionRate);
        dest.transfer(destAddress,destAmount);
        return destAmount;
    }

    function getExpectAmount(uint amount, uint rate) private pure returns(uint){
         
        return calcDstQty(amount, 18, 18, rate);
    }
}