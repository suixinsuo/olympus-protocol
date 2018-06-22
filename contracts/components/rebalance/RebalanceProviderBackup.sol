pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../interfaces/ComponentInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";


contract RebalanceProvider is Ownable, ComponentInterface {
    // TODO: is component
    OlympusExchangeInterface private exchangeProvider = OlympusExchangeInterface(0x304730f75cf4C92596FC61Cc239a649FEbC0E36E);
    enum RebalanceStatus {
        INACTIVE,
        INITIATED,
        READY_TO_TRADE,
        SELLING_IN_PROGRESS,
        SELLING_COMPLETE,
        BUYING_IN_PROGRESS,
        BUYING_COMPLETE
    }
    struct RebalanceToken {
        address tokenAddress;
        uint amount;
    }
    mapping(address => RebalanceStatus) rebalanceStatus;
    mapping(address => uint) tokenStep;
    mapping(address => uint) rebalancingTokenProgress;
    mapping(address => uint) lastRebalance;
    mapping(address => uint) rebalanceInterval;
    mapping(address => uint) ethValueRebalanceStart;
    mapping(address => uint) rebalanceSoldTokensETHReceived;
    mapping(address => RebalanceToken[]) rebalanceTokensToSell;
    mapping(address => RebalanceToken[]) rebalanceTokensToBuy;

    uint private PERCENTAGE_DENOMINATOR = 10000;
    uint private rebalanceDeltaPercentage = 30; // 0.3%
    uint private constant DEFAULT_TOKEN_STEP = 10;
    uint private constant DEFAULT_INTERVAL = 4 weeks;

    address constant private ETH_TOKEN = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

    function initializeRebalance(uint _rebalanceInterval) public returns (bool success){
        tokenStep[msg.sender] = DEFAULT_TOKEN_STEP;
        rebalanceInterval[msg.sender] = _rebalanceInterval > 1 weeks ? _rebalanceInterval : DEFAULT_INTERVAL;
        rebalanceStatus[msg.sender] = RebalanceStatus.INACTIVE;
        // solium-disable-next-line security/no-block-members
        lastRebalance[msg.sender] = now;
        return true;
    }

    function rebalancePrepareSellAndBuy() public returns (bool success){
        if(rebalanceStatus[msg.sender] == RebalanceStatus.INITIATED){
            uint totalIndexValue = getTotalIndexValue();
            uint i;
            address[] memory indexTokenAddresses;
            uint[] memory indexTokenWeights;
            (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();

            for(i = 0; i < indexTokenAddresses.length; i++) {
                // Get the amount of tokens expected for 1 ETH
                uint ETHTokenPrice;
                (ETHTokenPrice,) = exchangeProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");

                if (ETHTokenPrice == 0) {
                    // emit LogString("Error", "Price provider doesn't support this tokenIndex: ".toSlice().concat(Converter.bytes32ToString(bytes32(i)).toSlice()));
                }
                uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
                uint shouldHaveAmountOfTokensInETH = (totalIndexValue * indexTokenWeights[i]) / 100;
                uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

                // minus delta
                if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToSell[msg.sender].push(RebalanceToken({
                        tokenAddress: indexTokenAddresses[i],
                        amount: currentTokenBalance - shouldHaveAmountOfTokens
                    }));
                // minus delta
                } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToBuy[msg.sender].push(RebalanceToken({
                        tokenAddress: indexTokenAddresses[i],
                        // Convert token balance to ETH price (because we need to send ETH), taking into account the decimals of the token
                        amount: ((shouldHaveAmountOfTokensInETH - currentTokenBalance) * (10**ERC20Extended(indexTokenAddresses[i]).decimals())) / ETHTokenPrice
                    }));
                }
            //TODO Does this run out of gas for 100 tokens?
            }
            rebalanceStatus[msg.sender] = RebalanceStatus.READY_TO_TRADE;
        }
        return false;
    }

    function rebalance() public returns (bool success){
        // solium-disable-next-line security/no-block-members
        require(lastRebalance[msg.sender] + rebalanceInterval[msg.sender] <= now, "Time is not here yet");

        if(rebalanceStatus[msg.sender] == RebalanceStatus.INACTIVE){
            ethValueRebalanceStart[msg.sender] = address(msg.sender).balance;
            delete rebalanceTokensToSell[msg.sender];
            delete rebalanceTokensToBuy[msg.sender];
            rebalanceStatus[msg.sender] = RebalanceStatus.INITIATED;
        }
        uint i;
        uint currentProgress = rebalancingTokenProgress[msg.sender];

        require(rebalancePrepareSellAndBuy(), "Prepare sell and buy failed");

        if(rebalanceStatus[msg.sender] == RebalanceStatus.READY_TO_TRADE || rebalanceStatus[msg.sender] == RebalanceStatus.SELLING_IN_PROGRESS){
            rebalanceStatus[msg.sender] = rebalanceTokensToSell[msg.sender].length > 0 ? RebalanceStatus.SELLING_IN_PROGRESS : RebalanceStatus.SELLING_COMPLETE;
            // First sell tokens
            for(i = currentProgress; i < rebalanceTokensToSell[msg.sender].length; i++){
                if(i > currentProgress + tokenStep[msg.sender]){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    return false;
                }
                exchange(rebalanceTokensToSell[msg.sender][i].tokenAddress,ETH_TOKEN,rebalanceTokensToSell[msg.sender][i].amount);
                rebalancingTokenProgress[msg.sender]++;
                if(i == rebalanceTokensToSell[msg.sender].length - 1){
                    rebalanceStatus[msg.sender] = RebalanceStatus.SELLING_COMPLETE;
                }
            }
        }


        if(rebalanceStatus[msg.sender] == RebalanceStatus.SELLING_COMPLETE){
            rebalanceSoldTokensETHReceived[msg.sender] = address(msg.sender).balance - ethValueRebalanceStart[msg.sender];
            rebalanceStatus[msg.sender] = rebalanceTokensToBuy[msg.sender].length > 0 && rebalanceSoldTokensETHReceived[msg.sender] > 0 ? RebalanceStatus.BUYING_IN_PROGRESS : RebalanceStatus.BUYING_COMPLETE;
        }

        // Then buy tokens
        if(rebalanceStatus[msg.sender] == RebalanceStatus.BUYING_IN_PROGRESS){
            uint sellTxs = rebalancingTokenProgress[msg.sender] - currentProgress;
            rebalancingTokenProgress[msg.sender] = 0;
            uint assumedAmountOfEthToBuy;
            uint differencePercentage;
            bool surplus;

            // Get the total amount of ETH that we are supposed to buy
            for(i = 0; i < rebalanceTokensToBuy[msg.sender].length; i++){
                assumedAmountOfEthToBuy += rebalanceTokensToBuy[msg.sender][i].amount;
            }

            // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
            // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
            if(assumedAmountOfEthToBuy > rebalanceSoldTokensETHReceived[msg.sender]){
                differencePercentage = ((assumedAmountOfEthToBuy - rebalanceSoldTokensETHReceived[msg.sender]) * PERCENTAGE_DENOMINATOR) / assumedAmountOfEthToBuy;
            } else if (assumedAmountOfEthToBuy < rebalanceSoldTokensETHReceived[msg.sender]){
                surplus = true;
                differencePercentage = ((rebalanceSoldTokensETHReceived[msg.sender] - assumedAmountOfEthToBuy) * PERCENTAGE_DENOMINATOR) / rebalanceSoldTokensETHReceived[msg.sender];
            } else {
                differencePercentage = 0;
            }

            for(i = rebalancingTokenProgress[msg.sender]; i < rebalanceTokensToBuy[msg.sender].length; i++){

                if(i + sellTxs > currentProgress + tokenStep[msg.sender]){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    // Also take into account the number of sellTxs that have happened in the current function call
                    return false;
                }
                uint slippage;

                if(differencePercentage > 0){
                    // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                    slippage = (rebalanceTokensToBuy[msg.sender][i].amount * differencePercentage) / PERCENTAGE_DENOMINATOR;
                }
                if(surplus == true){
                    require(exchange(ETH_TOKEN,rebalanceTokensToBuy[msg.sender][i].tokenAddress,rebalanceTokensToBuy[msg.sender][i].amount + slippage), "Exchange buy failed");
                } else {
                    require(exchange(ETH_TOKEN,rebalanceTokensToBuy[msg.sender][i].tokenAddress,rebalanceTokensToBuy[msg.sender][i].amount - slippage), "Exchange buy failed");
                }
                rebalancingTokenProgress[msg.sender]++;
                if(i == rebalanceTokensToBuy[msg.sender].length - 1){
                    rebalanceStatus[msg.sender] = RebalanceStatus.BUYING_COMPLETE;
                }
            }

        }
        if(rebalanceStatus[msg.sender] == RebalanceStatus.BUYING_COMPLETE){
            // Yay, done! Reset everything, ready for the next time
            // solium-disable-next-line security/no-block-members
            lastRebalance[msg.sender] = now;
            rebalanceStatus[msg.sender] = RebalanceStatus.INACTIVE;
            rebalancingTokenProgress[msg.sender] = 0;
            return true;
        }
        return false;
    }

    function exchange(address _src, address _dest, uint _amount) private returns (bool){
        uint slippage;
        (,slippage) = exchangeProvider.getPrice(ERC20Extended(_src), ERC20Extended(_dest), _amount, "");

        if(_src == ETH_TOKEN){
            // TODO: where do we get the ETH from?
            return exchangeProvider.buyToken.value(_amount)(ERC20Extended(_dest),_amount,slippage,address(msg.sender),"",0x0);
        } else {
            // TODO: where do we get the tokens from?
            ERC20Extended(_src).approve(address(exchangeProvider),2**255);
            return exchangeProvider.sellToken(ERC20Extended(_src),_amount,slippage,address(msg.sender),"",0x0);
        }
    }

    function getTotalIndexValue() public view returns (uint totalValue){
        uint price;
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(msg.sender).getTokens();

        for(uint i = 0; i < indexTokenAddresses.length; i++){
            (price,) = exchangeProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");
            totalValue += ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender))*
            10**ERC20Extended(indexTokenAddresses[i]).decimals() / price;
        }
    }

    // Reset function, in case there is any issue.
    // Can not be executed once the actual trading has started for safety.
    function resetRebalance() public returns(bool) {
        require(
            rebalanceStatus[msg.sender] == RebalanceStatus.INACTIVE || rebalanceStatus[msg.sender] == RebalanceStatus.INITIATED || rebalanceStatus[msg.sender] == RebalanceStatus.READY_TO_TRADE);
        rebalanceStatus[msg.sender] = RebalanceStatus.INACTIVE;
        rebalancingTokenProgress[msg.sender] = 0;
        delete rebalanceTokensToSell[msg.sender];
        delete rebalanceTokensToBuy[msg.sender];
        return true;
    }

    // We should have this function, so that if there is an issue with a token (e.g. costing a lot of gas)
    // we can reduce the limit to narrow down the problematic token, or just temporary limit
    function updateTokensPerRebalance(uint _tokenAmount) public returns(bool){
        require(_tokenAmount > 0);
        tokenStep[msg.sender] = _tokenAmount;
        return true;
    }
}
