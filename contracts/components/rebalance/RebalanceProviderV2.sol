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
    mapping(address => address[]) public sourceTokens;
    mapping(address => address[]) public destTokens;
    mapping(address => uint[]) public srcAmount;

    enum RebalanceStatus { Initial, Calculated }
    mapping(address => RebalanceStatus) public rebalanceStatus;


    constructor(PriceProviderInterface _priceProvider) public {
        priceProvider = _priceProvider;
    }

    function updatePriceProvider(PriceProviderInterface _priceProvider) public onlyOwner returns(bool success){
        priceProvider = _priceProvider;
        return true;
    }

    function updateCachedPriceTimeout(uint _newTimeout) public onlyOwner {
        priceTimeout = _newTimeout;
    }

    function needsRebalance(uint _rebalanceDeltaPercentage, address _targetAddress) external view returns (bool) {
        uint i;
        uint[] memory priceAndTotalValue = new uint[](2);
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(_targetAddress).getTokens();
        uint[] memory indexTokenValues = new uint[](indexTokenAddresses.length);
        uint[] memory totalValueEach = new uint[](indexTokenAddresses.length);
        uint[] memory indexTokenBalances = new uint[](indexTokenAddresses.length);
        indexTokenValues = new uint[](indexTokenWeights.length);
        for(i = 0; i < indexTokenBalances.length; i++){
            (priceAndTotalValue[0],) = priceProvider.getPrice(
                ETH_TOKEN, ERC20Extended(indexTokenAddresses[i]), 10**18, 0x0);
            ERC20Extended indexToken = ERC20Extended(indexTokenAddresses[i]);
            uint decimals = indexToken.decimals();
            uint amount = indexToken.balanceOf(_targetAddress);
              // 18 - token decimals to account for the returned rate in Kyber, which is always 18 decimals
              // Even if the token is, for example, only 4 decimals
            priceAndTotalValue[1] = priceAndTotalValue[1].add(amount.mul(10**(18+18-decimals)).div(priceAndTotalValue[0]));
            indexTokenBalances[i] = amount;
            indexTokenValues[i] = amount.mul(10**(18+18-decimals)).div(priceAndTotalValue[0]);
        }
        //Safeguard, if total value is zero, don't rebalance
        if(priceAndTotalValue[1] == 0){
            return false;
        }
        bool[] memory tokensToTrade = new bool[](2);
        for(i = 0; i < indexTokenBalances.length; i++){
            totalValueEach[i] = priceAndTotalValue[1].mul(indexTokenWeights[i]).div(100);
            if(indexTokenValues[i] > getDeltaValue(totalValueEach[i], _rebalanceDeltaPercentage, true)) {
                tokensToTrade[0] = true;
            } else if (indexTokenValues[i] < getDeltaValue(totalValueEach[i], _rebalanceDeltaPercentage, false)) {
                tokensToTrade[1] = true;
            }
        }

        // Safeguard, make sure we have tokens to trade on both position (sell/buy)
        if(tokensToTrade[0] == true && tokensToTrade[1] == true){
            return true;
        }
        return false;
    }

    function getValues() internal returns (address[] indexTokenAddresses,uint[] indexTokenValues,uint[] totalValueEach){
        uint i;
        uint totalValue;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
        uint[] memory indexTokenBalances = new uint[](indexTokenAddresses.length);
        indexTokenValues = new uint[](indexTokenWeights.length);
        totalValueEach = new uint[](indexTokenAddresses.length);
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

    function getDeltaValue(uint inputValue, uint _rebalanceDeltaPercentage, bool positive) public view returns (uint){
        if(_rebalanceDeltaPercentage == 0){
            return inputValue;
        }
        uint extraValue = inputValue.mul(_rebalanceDeltaPercentage).div(10 ** ERC20Extended(msg.sender).decimals());
        return positive ? inputValue.add(extraValue) : inputValue.sub(extraValue);
    }

    function rebalanceGetTokensToTrade(uint _rebalanceDeltaPercentage) external returns (address[],address[],uint[]) {
        require(payFee(0), "Fee cannot be paid");
        delete sourceTokens[msg.sender];
        delete destTokens[msg.sender];
        delete srcAmount[msg.sender];
        uint[] memory counters = new uint[](4);
        uint[] memory totalValueEach;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenValues;

        (indexTokenAddresses, indexTokenValues, totalValueEach) = getValues();

        address[] memory tokensToSell = new address[](indexTokenAddresses.length);
        uint[] memory valueOfTokensToSell = new uint[](indexTokenAddresses.length);
        address[] memory tokensToBuy = new address[](indexTokenAddresses.length);
        uint[] memory valueOfTokensToBuy = new uint[](indexTokenAddresses.length);
        // This loop just determines the value of each tokens we need to sell or buy, not the amount of tokens.
        for(counters[0] = 0; counters[0] < indexTokenAddresses.length; counters[0]++){
            // If the value of the index tokens is greater than the value the token should have plus the delta amount
            // Then we need to sell some of these tokens in favour of other tokens
            if(indexTokenValues[counters[0]] > getDeltaValue(totalValueEach[counters[0]], _rebalanceDeltaPercentage, true)){
                tokensToSell[counters[2]] = (indexTokenAddresses[counters[0]]);
                valueOfTokensToSell[counters[2]] = (indexTokenValues[counters[0]].sub(totalValueEach[counters[0]]));
                counters[2]++;
            // If the value of the index tokens is smaller than the value the token should have minus the delta amount
            // Then we need to buy some of these tokens using the funds from selling the other tokens
            } else if (indexTokenValues[counters[0]] < getDeltaValue(totalValueEach[counters[0]], _rebalanceDeltaPercentage, false)){
                tokensToBuy[counters[3]] = indexTokenAddresses[counters[0]];
                valueOfTokensToBuy[counters[3]] = totalValueEach[counters[0]].sub(indexTokenValues[counters[0]]);
                counters[3]++;
            } else {
                continue;
            }
        }
        for(counters[0] = 0; counters[0] < counters[2]; counters[0]++) {
            for(counters[1] = 0; counters[1] < counters[3]; counters[1]++){
                if(valueOfTokensToSell[counters[0]] == 0){
                    // If we don't have any more value of this token to sell, break out of this loop, continue with the parent loop.
                    break;
                }
                if(valueOfTokensToBuy[counters[1]] > 0){
                    // If we still have value left, use as much of that to buy the next token.
                    uint val = valueOfTokensToSell[counters[0]] > valueOfTokensToBuy[counters[1]] ? valueOfTokensToBuy[counters[1]] : valueOfTokensToSell[counters[0]];
                    sourceTokens[msg.sender].push(tokensToSell[counters[0]]);
                    destTokens[msg.sender].push(tokensToBuy[counters[1]]);
                    srcAmount[msg.sender].push(val.mul(tempPriceStorage[tokensToSell[counters[0]]]).div(10**(18+18-ERC20Extended(tokensToSell[counters[0]]).decimals())));
                    // Substract the values, because they are now covered by the 'trades todo' as specified in sourceTokens, destTokens and srcAmount
                    valueOfTokensToBuy[counters[1]] = valueOfTokensToBuy[counters[1]].sub(val);
                    valueOfTokensToSell[counters[0]] = valueOfTokensToSell[counters[0]].sub(val);
                }
            }
        }
        return (sourceTokens[msg.sender],destTokens[msg.sender],srcAmount[msg.sender]);
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
