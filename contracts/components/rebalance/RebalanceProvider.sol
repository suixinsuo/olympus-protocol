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
   event  LogN(uint number, string text);
   event  LogA(address _address, string text);

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
        require(payFee(0));

        uint i;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
         emit LogA(msg.sender,' address rebalance');

        for(i = 0; i < indexTokenAddresses.length; i++) {
            // Get the amount of tokens expected for 1 ETH
            uint ETHTokenPrice;
// emit LogN(ETHTokenPrice,'price');
            (ETHTokenPrice,) = priceProvider.getPrice(ERC20Extended(ETH_TOKEN), ERC20Extended(indexTokenAddresses[i]), 10**18, "");

            if (ETHTokenPrice == 0) {
                tokensWithPriceIssues[msg.sender].push(indexTokenAddresses[i]);
            }
            uint currentTokenBalance = ERC20Extended(indexTokenAddresses[i]).balanceOf(address(msg.sender)); //
            uint shouldHaveAmountOfTokensInETH = (getTotalIndexValue() * indexTokenWeights[i]) / 100;
            uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

            // minus delta
            if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * _rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                tokensToSell[msg.sender].push(indexTokenAddresses[i]);
                amountsToSell[msg.sender].push(currentTokenBalance - shouldHaveAmountOfTokens);
            // minus delta
            } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * _rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                tokensToBuy[msg.sender].push(indexTokenAddresses[i]);
                amountsToBuy[msg.sender].push(shouldHaveAmountOfTokensInETH - (currentTokenBalance * (10**ERC20Extended(indexTokenAddresses[i]).decimals())) / ETHTokenPrice);
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
            assumedAmountOfEthToBuy += amountsToBuy[msg.sender][i];
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
        for(i = 0; i < amountsToBuy[msg.sender].length; i++) {
            uint slippage;

            if(differencePercentage > 0){
                // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                slippage = (amountsToBuy[msg.sender][i] * differencePercentage) / PERCENTAGE_DENOMINATOR;
            }
            if(surplus == true){
                amountsToBuy[msg.sender][i] = amountsToBuy[msg.sender][i] + slippage;
                continue;
            }
            amountsToBuy[msg.sender][i] = amountsToBuy[msg.sender][i] - slippage;
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
