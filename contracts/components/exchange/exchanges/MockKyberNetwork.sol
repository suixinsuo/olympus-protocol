pragma solidity 0.4.24;

import "../../../libs/utils.sol";
import "../../../libs/SimpleERC20Token.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

import "../../../libs/ERC20Extended.sol";


contract MockKyberNetwork {
    using SafeMath for uint256;

    uint public slippageMockRate  = 100;
    bool public simulatePriceZero = false;

    bytes32 name = "LocalMockKyber";
    struct Token{
        SimpleERC20Token   token;
        uint    slippageRate;
    }
    address ETH_ADDRESS = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    Token[] public supportedTokens;
    constructor (uint total,uint _decimals) public {
        require(total <= 50 && total > 0);
        for (uint i = 0; i < total; i++) {
            supportedTokens.push(Token({
                token: new SimpleERC20Token(_decimals),
                slippageRate:10**18*1000
            }));
        }
    }

    function setSlippageMockRate(uint _value) public {
        require(_value >= 0 && _value <= 100);
        slippageMockRate = _value;
    }

    function toggleSimulatePriceZero(bool _shouldSimulateZero) external returns(bool success){
        simulatePriceZero = _shouldSimulateZero;
        return true;
    }

    function supportedTokens() external view returns(address[]){
        address[] memory tokens = new address[](supportedTokens.length);
        for (uint i = 0; i < supportedTokens.length; i++) {
            tokens[i] = address(supportedTokens[i].token);
        }
        return tokens;
    }

    function getExpectedRate(ERC20Extended src, ERC20Extended dest, uint srcQty) external view
    returns (uint expectedRate, uint slippageRate)
    {
        return _getExpectedRate(src, dest, srcQty);
    }

    function _getExpectedRate(ERC20Extended src, ERC20Extended dest, uint) private view
    returns (uint expectedRate, uint slippageRate)
    {
        if (simulatePriceZero) {
            return (0,0);
        }
        //TOKEN --> Token Price
        if (address(dest) == ETH_ADDRESS) {
            return (10 ** 15, 10 ** 15);
        }
        //ETH ----> TOKEN Price
        if(address(src) == ETH_ADDRESS){
            for (uint i = 0; i < supportedTokens.length; i++){
                if(address(supportedTokens[i].token) == address(dest)){
                    return (supportedTokens[i].slippageRate, supportedTokens[i].slippageRate);
                }
            }
        }
        //TOKEN ----> TOKEN Price
        if((address(src) != ETH_ADDRESS)&&(address(dest) != ETH_ADDRESS)){
            for (uint t = 0; t < supportedTokens.length; t++){
                if(address(supportedTokens[t].token) == address(dest)){
                    return (10**18, 10**18);
                }
            }
        }

        return (10 ** 18 * 1000, 10 ** 18 * 1000);
    }
    function trade(
        ERC20Extended source,
        uint srcAmount,
        ERC20Extended dest,
        address destAddress,
        uint ,
        uint minConversionRate,
        address )
        external payable returns(uint)
    {
        uint slippageRate;
        uint expectedRate;
        (expectedRate, slippageRate) = _getExpectedRate(source,dest,srcAmount);
        require(slippageRate >= minConversionRate);

        //ETH ----> TOKEN Exchange
        if (address(source) == ETH_ADDRESS) {
            require(msg.value == srcAmount);
            uint destAmount = getExpectAmount(srcAmount, dest.decimals(), expectedRate);
            dest.transfer(destAddress,destAmount);
            return destAmount;
        }

        //TOKEN ----> ETH Exchange
        if(address(dest) == ETH_ADDRESS){
            require(msg.value == 0);
            source.transferFrom(msg.sender, address(this), srcAmount);
            uint ethAmount = Utils.calcDstQty(srcAmount, source.decimals(), 18, expectedRate);
            destAddress.transfer(ethAmount.div(100).mul(slippageMockRate));
            return ethAmount;
        }

        //TOKEN ----> TOKEN Exchange
        require(msg.value == 0);
        source.transferFrom(msg.sender, address(this), srcAmount);
        uint tokenAmount = Utils.calcDstQty(srcAmount, source.decimals(), 18, expectedRate);
        dest.transfer(destAddress,tokenAmount);
        return tokenAmount;

    }

    function getExpectAmount(uint amount, uint destDecimals, uint rate) private pure returns(uint){
        return Utils.calcDstQty(amount, 18, destDecimals, rate);
    }

    function () public payable  {

    }
}
