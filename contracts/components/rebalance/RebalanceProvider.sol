pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/PriceProviderInterface.sol";


contract RebalanceProvider is Ownable, ComponentInterface {
    // TODO: is component
    PriceProviderInterface private priceProvider = PriceProviderInterface(0x304730f75cf4C92596FC61Cc239a649FEbC0E36E);

    uint private PERCENTAGE_DENOMINATOR = 10000;
    uint private rebalanceDeltaPercentage = 30; // 0.3%

    address constant private ETH_TOKEN = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

    function rebalanceGetTokensToSellAndBuy() external view returns
    (address[] tokensToSell, uint[] amountsToSell, address[] tokensToBuy, uint[] amountsToBuy, address[] tokensWithPriceIssues) {
        uint totalIndexValue = getTotalIndexValue();
        uint i;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();

        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;
            (ETHTokenPrice,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");

            if (ETHTokenPrice == 0) {
                tokensWithPriceIssues.push(indexTokenAddresses[i]);
            }
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
            uint shouldHaveAmountOfTokensInETH = (totalIndexValue * indexTokenWeights[i]) / 100;
            uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

            // minus delta
            if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                tokensToSell.push(indexTokenAddresses[i]);
                amountsToSell.push(currentTokenBalance - shouldHaveAmountOfTokens);
            // minus delta
            } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                tokensToBuy.push(indexTokenAddresses[i]);
                amountsToBuy.push(((shouldHaveAmountOfTokensInETH - currentTokenBalance) * (10**ERC20Extended(indexTokenAddresses[i]).decimals())) / ETHTokenPrice);
            }
            //TODO Does this run out of gas for 100 tokens?
        }
        return (tokensToSell,amountsToSell,tokensToBuy,tokensToSell,tokensWithPriceIssues);
    }

    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale, uint[] _amountsToBuy)
    external view returns(uint[] recalculatedAmountsToBuy) {
        uint assumedAmountOfEthToBuy;
        uint differencePercentage;
        bool surplus;

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
                slippage = (amountsToBuy[i] * differencePercentage) / PERCENTAGE_DENOMINATOR;
            }
            if(surplus == true){
                recalculatedAmountsToBuy.push(_amountsToBuy[i].amount + slippage);
                continue;
            }
            recalculatedAmountsToBuy.push(_amountsToBuy[i].amount - slippage);
        }
        return recalculatedAmountsToBuy;
    }

    function getTotalIndexValue() public view returns (uint totalValue){
        uint price;
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(msg.sender).getTokens();

        for(uint i = 0; i < indexTokenAddresses.length; i++){
            (price,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");
            totalValue += ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender))*
            10**ERC20Extended(indexTokenAddresses[i]).decimals() / price;
        }
    }
}
