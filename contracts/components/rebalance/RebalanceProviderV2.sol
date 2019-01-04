pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/RebalanceInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/PriceProviderInterface.sol";
import "../../components/base/FeeCharger.sol";


contract RebalanceProviderV2 is FeeCharger {
    using SafeMath for uint256;

    PriceProviderInterface public priceProvider = PriceProviderInterface(0x0);
    uint public priceTimeout = 6 hours;
    ERC20Extended constant private ETH_TOKEN = ERC20Extended(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    mapping(address => uint) public tempPriceStorage;
    address[] public sourceTokens;
    address[] public destTokens;
    uint[] public srcAmount;

    enum RebalanceStatus { Initial, Calculated }
    mapping(address => RebalanceStatus) public rebalanceStatus;

    constructor(PriceProviderInterface _priceProvider) public {
        priceProvider = _priceProvider;
    }

    function getValues() internal returns (address[] indexTokenAddresses,uint[] indexTokenValues,uint[] totalValueEach){
        uint i;
        uint totalValue;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
        uint[] memory indexTokenBalances = new uint[](indexTokenAddresses.length);
        indexTokenValues = new uint[](indexTokenWeights.length);
        uint[] memory prices;
        (prices, ,) = priceProvider.getMultiplePricesOrCacheFallback(castToERC20Extended(indexTokenAddresses), priceTimeout);
        for(i = 0; i < indexTokenBalances.length; i++){
            ERC20Extended indexToken = ERC20Extended(indexTokenAddresses[i]);
            tempPriceStorage[indexTokenAddresses[i]] = prices[i];
            uint decimals = indexToken.decimals();
            uint amount = indexToken.balanceOf(msg.sender);
              // 18 - token decimals to account for the returned rate in Kyber, which is always 18 decimals
              // Even if the token is, for example, only 4 decimals
            totalValue = totalValue.add(amount.mul(10**(18+18-decimals)).div(prices[i]));
            indexTokenBalances[i] = amount;
            indexTokenValues[i] = amount.mul(10**(18+18-decimals)).div(prices[i]);
        }
        for(i = 0; i < indexTokenBalances.length; i++){
            totalValueEach[i] = totalValue.mul(indexTokenWeights[i]).div(100);
        }
    }

    function rebalanceGetTokensToTrade(uint _rebalanceDeltaPercentage) external returns (address[],address[],uint[]) {
        require(payFee(0), "Fee cannot be paid");
        uint[] memory counters = new uint[](2);
        uint[] memory totalValueEach;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenValues;

        (indexTokenAddresses, indexTokenValues, totalValueEach) = getValues();

        address[] storage tokensToSell;
        uint[] storage valueOfTokensToSell;
        address[] storage tokensToBuy;
        uint[] storage valueOfTokensToBuy;
        for(counters[0] = 0; counters[0] < indexTokenAddresses.length; counters[0]++){
            if(indexTokenValues[counters[0]] > totalValueEach[counters[0]]){
                tokensToSell.push(indexTokenAddresses[counters[0]]);
                valueOfTokensToSell.push(indexTokenValues[counters[0]] - totalValueEach[counters[0]]);
            } else {
                tokensToBuy[counters[0]] = indexTokenAddresses[counters[0]];
                valueOfTokensToBuy.push(indexTokenValues[counters[0]] - totalValueEach[counters[0]]);
            }
        }
        for(counters[0] = 0; counters[0] < tokensToSell.length; counters[0]++) {
            for(counters[1] = 0; counters[1] < tokensToBuy.length; counters[1]++){
                if(valueOfTokensToSell[counters[0]] == 0){
                    break;
                }
                if(valueOfTokensToBuy[counters[1]] > 0){
                    uint val = valueOfTokensToSell[counters[0]] > valueOfTokensToBuy[counters[1]] ? valueOfTokensToBuy[counters[1]] : valueOfTokensToSell[counters[0]];
                    sourceTokens.push(tokensToSell[counters[0]]);
                    destTokens.push(tokensToBuy[counters[1]]);
                    srcAmount.push(val.mul(tempPriceStorage[tokensToSell[counters[0]]]).div(10**(18+18-ERC20Extended(tokensToSell[counters[0]]).decimals())));
                    valueOfTokensToBuy[counters[1]] = valueOfTokensToBuy[counters[1]].sub(val);
                    valueOfTokensToSell[counters[0]] = valueOfTokensToSell[counters[0]].sub(val);
                }
            }
        }
        return (sourceTokens,destTokens,srcAmount);
    }

    function getTotalIndexValue() public returns (uint totalValue) {
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(msg.sender).getTokens();
        uint[] memory prices = new uint[](indexTokenAddresses.length);

        uint amount;
        uint decimals;
        ERC20Extended indexToken;
        (prices, ,) = priceProvider.getMultiplePricesOrCacheFallback(castToERC20Extended(indexTokenAddresses), priceTimeout);
        for(uint i = 0; i < indexTokenAddresses.length; i++) {
            indexToken = ERC20Extended(indexTokenAddresses[i]);
            decimals = indexToken.decimals();
            amount = indexToken.balanceOf(msg.sender);
            // 18 - token decimals to account for the returned rate in Kyber, which is always 18 decimals
            // Even if the token is, for example, only 4 decimals
            totalValue = totalValue.add(amount.mul(10**(18+18-decimals)).div(prices[i]));
        }
    }

    function castToERC20Extended(address[] _addresses) public pure returns (ERC20Extended[] _erc20Extended) {
        _erc20Extended = new ERC20Extended[](_addresses.length);
        for(uint i = 0; i < _addresses.length; i++) {
            _erc20Extended[i] = ERC20Extended(_addresses[i]);
        }
    }

}
