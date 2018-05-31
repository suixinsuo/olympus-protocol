pragma solidity ^0.4.23;

import "./libs/ERC20.sol";

contract RebalancePseudo {
    enum RebalanceStatus {
        INACTIVE,
        INITIATED,
        READY_TO_TRADE,
        SELLING_IN_PROGRESS,
        SELLING_COMPLETE,
        BUYING_IN_PROGRESS,
        BUYING_COMPLETE
    }
    RebalanceStatus private rebalanceStatus = RebalanceStatus.INACTIVE;
    address constant private ETH_TOKEN = 0xeeeeeeeeeeeeeeeeee;
    uint private tokenStep = 10;
    uint private rebalancingTokenProgress;
    uint private PERCENTAGE_DENOMINATOR = 10000;
    // Needs to have at least 0.3% difference in order to be eligible for rebalance
    uint private rebalanceDeltaPercentage = 30; // 0.3%
    uint private lastRebalance = 1000000000;
    uint private rebalanceInterval = 1000;
    uint private ethValueRebalanceStart;

    // We want to see the difference between the balance in ETH before and after tokens are sold
    uint private rebalanceSoldTokensETHReceived;
    uint totalIndexValue = 3000000000000;
    address[] private tokenAddresses = [
        0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0
    ];
    uint[] private tokenWeights = [
        1, 5, 4, 5, 11, 5, 2, 8, 9, 5, 10, 15, 5, 5, 10
    ];

    struct RebalanceToken {
        address tokenAddress;
        uint tokenWeight;
        uint amount;
    }

    RebalanceToken[] private rebalanceTokensToSell;
    RebalanceToken[] private rebalanceTokensToBuy;

    constructor() public {
    }

    function rebalance() public returns (bool success){
        // solium-disable-next-line security/no-block-members
        require(lastRebalance + rebalanceInterval < now);
        if(rebalanceStatus == RebalanceStatus.INACTIVE){
            ethValueRebalanceStart = address(this).balance;
            delete rebalanceTokensToSell;
            delete rebalanceTokensToBuy;
            rebalanceStatus = RebalanceStatus.INITIATED;
        }
        uint i;
        uint currentProgress = rebalancingTokenProgress;

        if(rebalanceStatus == RebalanceStatus.INITIATED){
            for(i = 0; i < tokenAddresses.length; i++) {
                // Get the amount of tokens expected for 1 ETH
                uint ETHTokenPrice = mockCoreGetPrice(tokenAddresses[i]);
                uint currentTokenBalance = ERC20(tokenAddresses[i]).balanceOf(address(this));
                uint shouldHaveAmountOfTokensInETH = (totalIndexValue / 100) * tokenWeights[i];
                uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;
                // minus delta
                if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToSell.push(RebalanceToken({
                        tokenAddress: tokenAddresses[i],
                        tokenWeight: tokenWeights[i],
                        amount: currentTokenBalance - shouldHaveAmountOfTokens
                    }));
                // minus delta
                } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToBuy.push(RebalanceToken({
                        tokenAddress: tokenAddresses[i],
                        tokenWeight: tokenWeights[i],
                        // Convert token balance to ETH price (because we need to send ETH), taking into account the decimals of the token
                        amount: shouldHaveAmountOfTokensInETH - (currentTokenBalance * (10**ERC20(tokenAddresses[i]).decimals()) / ETHTokenPrice)
                    }));
                }
            //TODO Does this run out of gas for 100 tokens?
            }
            rebalanceStatus = RebalanceStatus.READY_TO_TRADE;
        }

        if(rebalanceStatus == RebalanceStatus.READY_TO_TRADE || rebalanceStatus == RebalanceStatus.SELLING_IN_PROGRESS){
            rebalanceStatus = RebalanceStatus.SELLING_IN_PROGRESS;
            // First sell tokens
            for(i = currentProgress; i < rebalanceTokensToSell.length; i++){
                if(i > currentProgress + tokenStep){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    return false;
                }
                // TODO approve token transfers (depending on exchange implementation)
                require(mockCoreExchange(rebalanceTokensToSell[i].tokenAddress,ETH_TOKEN,rebalanceTokensToSell[i].amount));
                rebalancingTokenProgress++;
                if(i == rebalanceTokensToSell.length - 1){
                    rebalanceStatus = RebalanceStatus.SELLING_COMPLETE;
                }
            }
        }


        if(rebalanceStatus == RebalanceStatus.SELLING_COMPLETE){
            rebalanceSoldTokensETHReceived = address(this).balance - ethValueRebalanceStart;
            rebalanceStatus = RebalanceStatus.BUYING_IN_PROGRESS;
        }

        // Then buy tokens
        if(rebalanceStatus == RebalanceStatus.BUYING_IN_PROGRESS){
            uint sellTxs = rebalancingTokenProgress - currentProgress;
            rebalancingTokenProgress = 0;
            uint assumedAmountOfEthToBuy;
            uint differencePercentage;
            bool surplus;

            // Get the total amount of ETH that we are supposed to buy
            for(i = 0; i < rebalanceTokensToBuy.length; i++){
                assumedAmountOfEthToBuy += rebalanceTokensToBuy[i].amount;
            }
            // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
            // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
            if(assumedAmountOfEthToBuy > rebalanceSoldTokensETHReceived){
                differencePercentage = ((assumedAmountOfEthToBuy - rebalanceSoldTokensETHReceived) * PERCENTAGE_DENOMINATOR) / assumedAmountOfEthToBuy;
            } else if (assumedAmountOfEthToBuy < rebalanceSoldTokensETHReceived){
                surplus = true;
                differencePercentage = ((rebalanceSoldTokensETHReceived - assumedAmountOfEthToBuy) * PERCENTAGE_DENOMINATOR) / rebalanceSoldTokensETHReceived;
            } else {
                differencePercentage = 0;
            }

            for(i = rebalancingTokenProgress; i < rebalanceTokensToBuy.length; i++){

                if(i + sellTxs > currentProgress + tokenStep){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    // Also take into account the number of sellTxs that have happened in the current function call
                    return false;
                }
                uint slippage;
                if(differencePercentage > 0){
                    // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                    slippage = (rebalanceTokensToBuy[i].amount * differencePercentage) / PERCENTAGE_DENOMINATOR;
                }
                if(surplus == true){
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount + slippage));
                } else {
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount - slippage));
                }
                rebalancingTokenProgress++;
                if(i == rebalanceTokensToBuy.length - 1){
                    rebalanceStatus = RebalanceStatus.BUYING_COMPLETE;
                }
            }

        }

        if(rebalanceStatus == RebalanceStatus.BUYING_COMPLETE){
            // Yay, done! Reset everything, ready for the next time
            // solium-disable-next-line security/no-block-members
            lastRebalance = now;
            rebalanceStatus = RebalanceStatus.INACTIVE;
            rebalancingTokenProgress = 0;
            return true;
        }
        return false;
    }

    // Reset function, in case there is any issue.
    // Can not be executed once the actual trading has started for safety.
    function resetRebalance() public returns(bool) {
        require(
            rebalanceStatus == RebalanceStatus.INACTIVE || rebalanceStatus == RebalanceStatus.INITIATED || rebalanceStatus == RebalanceStatus.READY_TO_TRADE);
        rebalanceStatus = RebalanceStatus.INACTIVE;
        rebalancingTokenProgress = 0;
        return true;
    }

    // We should have this function, so that if there is an issue with a token (e.g. costing a lot of gas)
    // we can reduce the limit to narrow down the problematic token, or just temporary limit
    function updateTokensPerRebalance(uint tokenAmount) public returns(bool){
        require(tokenAmount > 0);
        tokenStep = tokenAmount;
        return true;
    }

    function mockCoreGetPrice(address _tokenAddress) public pure returns (uint) {
        if(_tokenAddress != address(0x213)){
            // return the expected result for a 1 ETH trade
            return 10000000000000000;
        }
    }

    function mockCoreExchange(address _src, address _dest, uint _amount) public pure returns (bool){
        if(_src != address(0x213) && _dest != address(0x213) && _amount > 0){
            return true;
        }
        return false;
    }

}
