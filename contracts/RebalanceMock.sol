pragma solidity ^0.4.23;

import "./libs/ERC20.sol";
import "./libs/strings.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";

contract RebalanceMock {
    using strings for *;
    using SafeMath for uint256;

    event LogUint(string desc, uint value);
    event LogString(string desc, string value);
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
    uint public balanceMock;
    uint private tokenStep = 10;
    uint private rebalancingTokenProgress;
    uint private PERCENTAGE_DENOMINATOR = 10000;
    // Needs to have at least 0.3% difference in order to be eligible for rebalance
    uint private rebalanceDeltaPercentage = 30; // 0.3%
    uint private lastRebalance = 1000000000;
    uint private rebalanceInterval = 0; // Interval is 0 for testing purposes, set to 4 weeks for example for real one. Should be configurable
    uint private ethValueRebalanceStart;

    // We want to see the difference between the balance in ETH before and after tokens are sold
    uint private rebalanceSoldTokensETHReceived;

    uint mockPriceSell = 1*10**19;
    uint mockPriceBuy = 1*10**17;
    uint mockDeviantPriceSellOne = 1*10**20;
    uint mockDeviantPriceBuyOne = 1*10**16;
    uint mockDeviantPriceSellTwo = 1*10**21;
    uint mockDeviantPriceBuyTwo = 1*10**15;


    mapping (address => uint) mockTokenBalances;
    address[] private tokenAddresses = [
        0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x10,0x11,0x12,0x13,0x14,0x15
    ];
    uint[] private tokenWeights = [
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10
    ];

    struct RebalanceToken {
        address tokenAddress;
        uint tokenWeight;
        uint amount;
    }

    RebalanceToken[] public rebalanceTokensToSell;
    RebalanceToken[] public rebalanceTokensToBuy;

    constructor() public {
        mockTokenBalances[0x01] = 5*10**18;
        mockTokenBalances[0x02] = 5*10**18;
        mockTokenBalances[0x03] = 5*10**18;
        mockTokenBalances[0x04] = 5*10**18;
        mockTokenBalances[0x05] = 5*10**18;
        mockTokenBalances[0x06] = 5*10**18;
        mockTokenBalances[0x07] = 5*10**18;
        mockTokenBalances[0x08] = 5*10**18;
        mockTokenBalances[0x09] = 5*10**18;
        mockTokenBalances[0x10] = 5*10**18;
        mockTokenBalances[0x11] = 10*10**18;
        mockTokenBalances[0x12] = 10*10**18;
        mockTokenBalances[0x13] = 10*10**18;
        mockTokenBalances[0x14] = 10*10**18;
        mockTokenBalances[0x15] = 10*10**18;

    }

    function rebalancePrepareSellAndBuy() private returns (bool success){
        if(rebalanceStatus == RebalanceStatus.INITIATED){
            uint totalIndexValue = getTotalIndexValue();
            uint i;
            for(i = 0; i < tokenAddresses.length; i++) {
                // Get the amount of tokens expected for 1 ETH
                uint ETHTokenPrice = mockCoreGetPrice(ETH_TOKEN, tokenAddresses[i]);
                if(ETHTokenPrice == 0){
                    emit LogString("Error", "Price provider doesn't support this tokenIndex: ".toSlice().concat(Converter.bytes32ToString(bytes32(i)).toSlice()));
                }
                uint currentTokenBalance = mockTokenBalances[tokenAddresses[i]]; //
                uint shouldHaveAmountOfTokensInETH = (totalIndexValue * tokenWeights[i]) / 100;
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
                    // emit LogUint("should have, ETH value    ", shouldHaveAmountOfTokensInETH);
                    // emit LogUint("should have, Token amount ", shouldHaveAmountOfTokens);
                    // emit LogUint("current balance, ETH value", currentTokenBalance*10**18 / ETHTokenPrice);
                    // emit LogUint("current balance, token amo", currentTokenBalance);
                    // emit LogUint("Need to buy, ETH value    ", ((shouldHaveAmountOfTokens - currentTokenBalance) * 10**18) / ETHTokenPrice);
                    // emit LogUint("need to buy, Token amount ", shouldHaveAmountOfTokens - currentTokenBalance);
                    // emit LogUint("Expected End ETH value    ", (currentTokenBalance*10**18 / ETHTokenPrice) + ((shouldHaveAmountOfTokens - currentTokenBalance) * 10**18 / ETHTokenPrice));
                    // emit LogUint("Expected End Token amount ", currentTokenBalance + shouldHaveAmountOfTokens - currentTokenBalance);

                    rebalanceTokensToBuy.push(RebalanceToken({
                        tokenAddress: tokenAddresses[i],
                        tokenWeight: tokenWeights[i],
                        // Convert token balance to ETH price (because we need to send ETH), taking into account the decimals of the token

                        amount: ((shouldHaveAmountOfTokens - currentTokenBalance) * 10**18) / ETHTokenPrice
                        // amount: shouldHaveAmountOfTokensInETH - (currentTokenBalance * (10**ERC20(tokenAddresses[i]).decimals()) / ETHTokenPrice)
                    }));
                }
            //TODO Does this run out of gas for 100 tokens?
            }
            rebalanceStatus = RebalanceStatus.READY_TO_TRADE;
        }
        return true;
    }

    function rebalance() public returns (bool success){
        // solium-disable-next-line security/no-block-members
        require(lastRebalance + rebalanceInterval < now, "Time is not here yet");
        if(rebalanceStatus == RebalanceStatus.INACTIVE){
            // ethValueRebalanceStart = address(this).balance;
            ethValueRebalanceStart = balanceMock;
            delete rebalanceTokensToSell;
            delete rebalanceTokensToBuy;
            rebalanceStatus = RebalanceStatus.INITIATED;
        }
        uint i;
        uint currentProgress = rebalancingTokenProgress;
        require(rebalancePrepareSellAndBuy(), "Prepare sell and buy failed");

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
                require(mockCoreExchange(rebalanceTokensToSell[i].tokenAddress,ETH_TOKEN,rebalanceTokensToSell[i].amount), "Exchange sale failed");
                rebalancingTokenProgress++;
                if(i == rebalanceTokensToSell.length - 1){
                    rebalanceStatus = RebalanceStatus.SELLING_COMPLETE;
                }
            }
        }


        if(rebalanceStatus == RebalanceStatus.SELLING_COMPLETE){
            rebalanceSoldTokensETHReceived = balanceMock - ethValueRebalanceStart;
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
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount + slippage), "Exchange buy failed");
                } else {
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount - slippage), "Exchange buy failed");
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
    function updateTokenAmountPerRebalance(uint tokenAmount) public returns(bool){
        require(tokenAmount > 0);
        tokenStep = tokenAmount;
        return true;
    }

    function mockCoreGetPrice(address _src, address _dest) public view returns (uint) {
        // return the expected result for a 1 ETH trade
        if(_src == address(0x01)){
            return mockDeviantPriceBuyOne;
        } else if (_dest == address(0x01)){
            return mockDeviantPriceSellOne;
        } else if (_src == address(0x02)){
            return mockDeviantPriceBuyTwo;
        } else if (_dest == address(0x02)){
            return mockDeviantPriceSellTwo;
        }
        if(_src == ETH_TOKEN){
            return mockPriceSell;
        }
        return mockPriceBuy;
    }

    function mockCoreExchange(address _src, address _dest, uint _amount) public returns (bool){
        if(_src != ETH_TOKEN){
            mockTokenBalances[_src] -= _amount;
            balanceMock += _amount * mockCoreGetPrice(_src,ETH_TOKEN) / 10**18;
        }
        if(_dest != ETH_TOKEN){
            mockTokenBalances[_dest] += _amount * mockCoreGetPrice(ETH_TOKEN,_dest) / 10**18;
            balanceMock -= _amount;
        }
        return true;
    }

    function getTotalIndexValue() public returns (uint totalValue){
        for(uint i = 0; i < tokenAddresses.length; i++){
            totalValue += mockTokenBalances[tokenAddresses[i]] * mockCoreGetPrice(tokenAddresses[i], ETH_TOKEN) / 10**18;
        }
        emit LogUint("totalValue", totalValue);
    }

    function getTokenBalances() public view returns (uint[]){
        uint[] memory balances = new uint[](tokenAddresses.length);
        for(uint i = 0; i < tokenAddresses.length; i++){
            balances[i] = mockTokenBalances[tokenAddresses[i]];
        }
        return balances;
    }

    function getTokenValues() public view returns (uint[]){
        uint[] memory values = new uint[](tokenAddresses.length);
        for(uint i = 0; i < tokenAddresses.length; i++){
            values[i] = mockTokenBalances[tokenAddresses[i]] * mockCoreGetPrice(tokenAddresses[i], ETH_TOKEN) / 10**18;
        }
        return values;
    }

    function getTokenLengths() public view returns (uint[2]){
        return [rebalanceTokensToSell.length, rebalanceTokensToBuy.length];
    }

    function changeNormalMockPrice(uint percentage, bool moreExpensive) public {
        if(moreExpensive){
            mockPriceBuy = mockPriceBuy - (mockPriceBuy*percentage/100);
            mockPriceSell = mockPriceSell + (mockPriceSell*percentage/100);
        } else {
            mockPriceBuy = mockPriceBuy + (mockPriceBuy*percentage/100);
            mockPriceSell = mockPriceSell - (mockPriceSell*percentage/100);
        }
    }

    function changeDeviantMockPriceOne(uint percentage, bool moreExpensive) public {
        if(moreExpensive){
            mockDeviantPriceBuyOne = mockDeviantPriceBuyOne - (mockDeviantPriceBuyOne*percentage/100);
            mockDeviantPriceSellOne = mockDeviantPriceSellOne + (mockDeviantPriceSellOne*percentage/100);
        } else {
            mockDeviantPriceBuyOne = mockDeviantPriceBuyOne + (mockDeviantPriceBuyOne*percentage/100);
            mockDeviantPriceSellOne = mockDeviantPriceSellOne - (mockDeviantPriceSellOne*percentage/100);
        }
    }

    function changeDeviantMockPriceTwo(uint percentage, bool moreExpensive) public {
        if(moreExpensive){
            mockDeviantPriceBuyTwo = mockDeviantPriceBuyTwo - (mockDeviantPriceBuyTwo*percentage/100);
            mockDeviantPriceSellTwo = mockDeviantPriceSellTwo + (mockDeviantPriceSellTwo*percentage/100);
        } else {
            mockDeviantPriceBuyTwo = mockDeviantPriceBuyTwo + (mockDeviantPriceBuyTwo*percentage/100);
            mockDeviantPriceSellTwo = mockDeviantPriceSellTwo - (mockDeviantPriceSellTwo*percentage/100);
        }
    }

}
