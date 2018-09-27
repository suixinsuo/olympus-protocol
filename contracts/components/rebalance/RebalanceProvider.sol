pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/RebalanceInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/PriceProviderInterface.sol";
import "../../components/base/FeeCharger.sol";


contract RebalanceProvider is FeeCharger, RebalanceInterface {
    using SafeMath for uint256;

    PriceProviderInterface private priceProvider = PriceProviderInterface(0x0);

    string public name = "Rebalance";
    string public description = "Help to rebalance quantity of tokens depending of the weight assigned in the derivative";
    string public category = "Rebalance";
    string public version = "1.1-20180919";

    uint private constant PERCENTAGE_DENOMINATOR = 10000;
    uint private constant RECALCULATION_PERCENTAGE_DENOMINATOR = 10**18;
    uint private priceTimeout = 6 hours;

    ERC20Extended constant private ETH_TOKEN = ERC20Extended(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    enum RebalanceStatus { Initial, Calculated, Recalculated }
    mapping(address => address[]) public tokensToSell;
    mapping(address => uint[]) public amountsToSell;
    mapping(address => address[]) public tokensToBuy;
    mapping(address => uint[]) public amountsToBuy;
    mapping(address => address[]) public tokensWithPriceIssues;
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

    function needsRebalance(uint _rebalanceDeltaPercentage, address _targetAddress) external view returns (bool _needsRebalance) {
        if(rebalanceStatus[_targetAddress] != RebalanceStatus.Initial) {
            return true;
        }

        uint i;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        bool itemsToBuy = false;
        bool itemsToSell = false;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(_targetAddress).getTokens();
        uint totalIndexValue = getTotalIndexValueWithoutCache(_targetAddress);
        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;
            (ETHTokenPrice,) = priceProvider.getPrice(
                ETH_TOKEN, ERC20Extended(indexTokenAddresses[i]), 10**18, 0x0);
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(_targetAddress);
            uint shouldHaveAmountOfTokensInETH = (totalIndexValue.mul(indexTokenWeights[i])).div(100);
            uint multipliedTokenBalance = currentTokenBalance.mul(_rebalanceDeltaPercentage);
            if ((shouldHaveAmountOfTokensInETH.mul(ETHTokenPrice)).div(10**18) <
                currentTokenBalance.sub(multipliedTokenBalance.div(PERCENTAGE_DENOMINATOR))){
                itemsToSell = true;
            } else if ((shouldHaveAmountOfTokensInETH.mul(ETHTokenPrice)).div(10**18) > currentTokenBalance.add(multipliedTokenBalance.div(PERCENTAGE_DENOMINATOR))){
                itemsToBuy = true;
            }
        }

        if(itemsToBuy && itemsToSell){
            return true;
        }

        return false;
    }

    function rebalanceGetTokensToSellAndBuy(uint _rebalanceDeltaPercentage) external returns
    (address[] _tokensToSell, uint[] _amountsToSell, address[] _tokensToBuy, uint[] _amountsToBuy, address[] _tokensWithPriceIssues) {
        if(rebalanceStatus[msg.sender] == RebalanceStatus.Calculated || rebalanceStatus[msg.sender] == RebalanceStatus.Recalculated) {
            return (
                tokensToSell[msg.sender],
                amountsToSell[msg.sender],
                tokensToBuy[msg.sender],
                amountsToBuy[msg.sender],
                tokensWithPriceIssues[msg.sender]
            );
        }
        require(payFee(0), "Fee cannot be paid");

        uint i;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
        uint totalIndexValue = getTotalIndexValue();
        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;
            (ETHTokenPrice,,) = priceProvider.getPriceOrCacheFallback(
                ETH_TOKEN, ERC20Extended(indexTokenAddresses[i]), 10**18, 0x0, priceTimeout);

            if (ETHTokenPrice == 0) {
                tokensWithPriceIssues[msg.sender].push(indexTokenAddresses[i]);
            }
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
            uint shouldHaveAmountOfTokensInETH = (totalIndexValue.mul(indexTokenWeights[i])).div(100);
            uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH.mul(ETHTokenPrice)).div(10**18);
            uint multipliedTokenBalance = currentTokenBalance.mul(_rebalanceDeltaPercentage);
            // minus delta
            if (shouldHaveAmountOfTokens < currentTokenBalance.sub(multipliedTokenBalance.div(PERCENTAGE_DENOMINATOR))){
                tokensToSell[msg.sender].push(indexTokenAddresses[i]);
                amountsToSell[msg.sender].push(currentTokenBalance - shouldHaveAmountOfTokens);
            // minus delta
            } else if (shouldHaveAmountOfTokens > currentTokenBalance.add(multipliedTokenBalance.div(PERCENTAGE_DENOMINATOR))){
                tokensToBuy[msg.sender].push(indexTokenAddresses[i]);
                amountsToBuy[msg.sender].push(
                  shouldHaveAmountOfTokensInETH.sub(
                    currentTokenBalance
                    .mul(10**ERC20Extended(indexTokenAddresses[i]).decimals())
                    .div(ETHTokenPrice)));
            }
            //TODO Does this run out of gas for 100 tokens?
        }
        rebalanceStatus[msg.sender] = RebalanceStatus.Calculated;
        return (
            tokensToSell[msg.sender],
            amountsToSell[msg.sender],
            tokensToBuy[msg.sender],
            amountsToBuy[msg.sender],
            tokensWithPriceIssues[msg.sender]
        );
    }

    function recalculateTokensToBuyAfterSale(uint _receivedETHFromSale)
    external returns(uint[] _recalculatedAmountsToBuy) {
        if(rebalanceStatus[msg.sender] == RebalanceStatus.Recalculated) {
            return (amountsToBuy[msg.sender]);
        }
        uint i;
        uint assumedAmountOfEthToBuy;
        uint differencePercentage;
        bool surplus;
        _recalculatedAmountsToBuy = new uint[](amountsToBuy[msg.sender].length);

        // Get the total amount of ETH that we are supposed to buy
        for(i = 0; i < amountsToBuy[msg.sender].length; i++){
            assumedAmountOfEthToBuy = assumedAmountOfEthToBuy.add(amountsToBuy[msg.sender][i]);
        }
        // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
        // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
        if(assumedAmountOfEthToBuy > _receivedETHFromSale){
            differencePercentage = ((assumedAmountOfEthToBuy.sub(_receivedETHFromSale)).mul(RECALCULATION_PERCENTAGE_DENOMINATOR)).div(assumedAmountOfEthToBuy);
        } else if (assumedAmountOfEthToBuy < _receivedETHFromSale){
            surplus = true;
            differencePercentage = ((_receivedETHFromSale.sub(assumedAmountOfEthToBuy)).mul(RECALCULATION_PERCENTAGE_DENOMINATOR)).div(_receivedETHFromSale);
        } else {
            differencePercentage = 0;
        }
        // Reset it, so it can be used again for the recalculation
        assumedAmountOfEthToBuy = 0;
        for(i = 0; i < amountsToBuy[msg.sender].length; i++) {
            uint slippage;

            if(differencePercentage > 0){
                // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                slippage = (amountsToBuy[msg.sender][i].mul(differencePercentage)).div(RECALCULATION_PERCENTAGE_DENOMINATOR);
            }
            if(surplus == true){
                amountsToBuy[msg.sender][i] = amountsToBuy[msg.sender][i].add(slippage);
                continue;
            }
            amountsToBuy[msg.sender][i] = amountsToBuy[msg.sender][i].sub(slippage);
            assumedAmountOfEthToBuy = assumedAmountOfEthToBuy.add(amountsToBuy[msg.sender][i]);
        }
        // This shouldn't be different from the received ETH from the sale, but if it is, it is only a couple wei due to rounding issues
        // Deduct from or add it to the first token, as a safeguard
        if(assumedAmountOfEthToBuy > _receivedETHFromSale) {
            amountsToBuy[msg.sender][0] = amountsToBuy[msg.sender][0].sub(assumedAmountOfEthToBuy.sub(_receivedETHFromSale));
        } else if (assumedAmountOfEthToBuy < _receivedETHFromSale) {
            amountsToBuy[msg.sender][0] = amountsToBuy[msg.sender][0].add(_receivedETHFromSale.sub(assumedAmountOfEthToBuy));
        }
        rebalanceStatus[msg.sender] = RebalanceStatus.Recalculated;
        return amountsToBuy[msg.sender];
    }

    function getRebalanceInProgress() external returns (bool inProgress) {
        return rebalanceStatus[msg.sender] != RebalanceStatus.Initial;
    }

    function finalize() external returns (bool success) {
        rebalanceStatus[msg.sender] = RebalanceStatus.Initial;
        delete tokensToSell[msg.sender];
        delete amountsToSell[msg.sender];
        delete tokensToBuy[msg.sender];
        delete amountsToBuy[msg.sender];
        delete tokensWithPriceIssues[msg.sender];
        return true;
    }

    function getTotalIndexValue() public returns (uint totalValue){
        uint[] memory prices;
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(msg.sender).getTokens();
        uint amount;
        uint decimals;
        ERC20Extended indexToken;
        (prices,,) = priceProvider.getMultiplePricesOrCacheFallback(castToERC20Extended(indexTokenAddresses),priceTimeout);
        for(uint i = 0; i < indexTokenAddresses.length; i++) {
            indexToken = ERC20Extended(indexTokenAddresses[i]);
            decimals = indexToken.decimals();
            amount = indexToken.balanceOf(msg.sender);
            totalValue = totalValue.add(amount.mul(10**decimals).div(prices[i]));
        }
    }

    function getTotalIndexValueWithoutCache(address _indexAddress) public view returns (uint totalValue) {
        uint price;
        address[] memory indexTokenAddresses;
        (indexTokenAddresses, ) = IndexInterface(_indexAddress).getTokens();

        for(uint i = 0; i < indexTokenAddresses.length; i++) {
            (price,) = priceProvider.getPrice(
                ETH_TOKEN, ERC20Extended(indexTokenAddresses[i]), 10**18, 0x0);
            totalValue = totalValue.add(ERC20Extended(indexTokenAddresses[i]).balanceOf(address(_indexAddress)).mul(
            10**ERC20Extended(indexTokenAddresses[i]).decimals()).div(price));
        }
    }

    function castToERC20Extended(address[] _addresses) public pure returns (ERC20Extended[] _erc20Extended) {
        _erc20Extended = new ERC20Extended[](_addresses.length);
        for(uint i = 0; i < _addresses.length; i++){
            _erc20Extended[i] = ERC20Extended(_addresses[i]);
        }
    }
}
