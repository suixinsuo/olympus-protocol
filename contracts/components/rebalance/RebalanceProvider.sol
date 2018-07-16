pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/RebalanceInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/PriceProviderInterface.sol";
import "../../components/base/FeeCharger.sol";


contract RebalanceProvider is FeeCharger, RebalanceInterface {
   using SafeMath for uint256;

    PriceProviderInterface private priceProvider = PriceProviderInterface(0x0);

    string public name = "Rebalance";
    string public description ="Help to rebalance quantity of tokens depending of the weight assigned in the derivative";
    string public category = "Rebalance";
    string public version = "v1.0";

    uint private constant PERCENTAGE_DENOMINATOR = 10000;

    address constant private ETH_TOKEN = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

    constructor(PriceProviderInterface _priceProvider) public {
        priceProvider = _priceProvider;
    }

    function updatePriceProvider(PriceProviderInterface _priceProvider) public onlyOwner returns(bool success){
        priceProvider = _priceProvider;
        return true;
    }

    function getArrayLengths(uint rebalanceDeltaPercentage, uint totalIndexValue, address[] indexTokenAddresses, uint[] indexTokenWeights)
    private view returns(uint sellCounter, uint buyCounter, uint issueCounter){
        uint i;
        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;

            (ETHTokenPrice,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");

            if (ETHTokenPrice == 0) {
                issueCounter++;
            }
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
            uint shouldHaveAmountOfTokensInETH = (totalIndexValue * indexTokenWeights[i]) / 100;
            uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;
            if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                sellCounter++;
            } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                buyCounter++;
            }
        }
    }

    function rebalanceGetTokensToSellAndBuy(uint _rebalanceDeltaPercentage) external returns
    (address[] _tokensToSell, uint[] _amountsToSell, address[] _tokensToBuy, uint[] _amountsToBuy, address[] _tokensWithPriceIssues) {
        require(payFee(0));

        uint i;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        uint[] memory arrayLengths = new uint[](3);
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
        uint[] memory buySellCounters = new uint[](2);
        (arrayLengths[0], arrayLengths[1], arrayLengths[2]) = getArrayLengths(_rebalanceDeltaPercentage, getTotalIndexValue(), indexTokenAddresses, indexTokenWeights);
        _tokensToSell = new address[](arrayLengths[0]);
        _amountsToSell = new uint[](arrayLengths[0]);
        _tokensToBuy = new address[](arrayLengths[1]);
        _amountsToBuy = new uint[](arrayLengths[1]);
        _tokensWithPriceIssues = new address[](arrayLengths[2]);
        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;

            (ETHTokenPrice,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");

            if (ETHTokenPrice == 0) {
                _tokensWithPriceIssues[i] = indexTokenAddresses[i];
            }
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
            uint shouldHaveAmountOfTokensInETH = (getTotalIndexValue() * indexTokenWeights[i]) / 100;
            uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

            // minus delta
            if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * _rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                _tokensToSell[buySellCounters[1]] = indexTokenAddresses[i];
                _amountsToSell[buySellCounters[1]] = currentTokenBalance - shouldHaveAmountOfTokens;
                buySellCounters[1]++;
            // minus delta
            } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * _rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                _tokensToBuy[buySellCounters[0]] = indexTokenAddresses[i];
                _amountsToBuy[buySellCounters[0]] = (shouldHaveAmountOfTokensInETH - (currentTokenBalance * (10**ERC20Extended(indexTokenAddresses[i]).decimals())) / ETHTokenPrice);
                buySellCounters[0]++;
            }
            //TODO Does this run out of gas for 100 tokens?
        }

    }

    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale, uint[] _amountsToBuy)
    external pure returns(uint[] _recalculatedAmountsToBuy) {
        uint i;
        uint assumedAmountOfEthToBuy;
        uint differencePercentage;
        bool surplus;
        _recalculatedAmountsToBuy = new uint[](_amountsToBuy.length);

        // Get the total amount of ETH that we are supposed to buy
        for(i = 0; i < _amountsToBuy.length; i++){
            assumedAmountOfEthToBuy += _amountsToBuy[i];
        }

        // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
        // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
        if(assumedAmountOfEthToBuy > _receivedETHFromSale){
            differencePercentage = ((assumedAmountOfEthToBuy - _receivedETHFromSale) * PERCENTAGE_DENOMINATOR) / assumedAmountOfEthToBuy;
        } else if (assumedAmountOfEthToBuy < _receivedETHFromSale){
            surplus = true;
            differencePercentage = ((_receivedETHFromSale - assumedAmountOfEthToBuy) * PERCENTAGE_DENOMINATOR) / _receivedETHFromSale;
        } else {
            differencePercentage = 0;
        }
        for(i = 0; i < _amountsToBuy.length; i++) {
            uint slippage;

            if(differencePercentage > 0){
                // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                slippage = (_amountsToBuy[i] * differencePercentage) / PERCENTAGE_DENOMINATOR;
            }
            if(surplus == true){
                _recalculatedAmountsToBuy[i] = _amountsToBuy[i] + slippage;
                continue;
            }
            _recalculatedAmountsToBuy[i] = _amountsToBuy[i] - slippage;
        }
        return _recalculatedAmountsToBuy;
    }

    function getTotalIndexValue() public view returns (uint totalValue){
        uint price;
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(msg.sender).getTokens();

        for(uint i = 0; i < indexTokenAddresses.length; i++) {
            (price,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, 0x0);
            totalValue += ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender))*
            10**ERC20Extended(indexTokenAddresses[i]).decimals() / price;
        }
    }
}
