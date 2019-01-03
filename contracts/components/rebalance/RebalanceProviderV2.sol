pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/RebalanceInterface.sol";
import "../../interfaces/IndexInterface.sol";
import "../../interfaces/PriceProviderInterface.sol";
import "../../components/base/FeeCharger.sol";


contract RebalanceProvider is FeeCharger {
    using SafeMath for uint256;

    PriceProviderInterface public priceProvider = PriceProviderInterface(0x0);
    uint public priceTimeout = 6 hours;
    ERC20Extended constant private ETH_TOKEN = ERC20Extended(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    address[] public sourceTokens;
    address[] public destTokens;
    uint[] public srcAmount; // TODO convert tokenAmount

// Rates 100000000000000000, 500000000000000000, 1000000000000000000, 10000000000000000000
// Balances 1000000000000000000, 2000000000000000000, 500000000000000000, 100000000000000000
// Values 100000000000000000, 1000000000000000000, 500000000000000000, 1000000000000000000

// Total value 100000000000000000+1000000000000000000+500000000000000000,1000000000000000000 = 2600000000000000000
// Total value each: 650000000000000000

// Should haveBalance each:
// 6500000000000000000
// 1300000000000000000
// 650000000000000000
// 65000000000000000

// Should buy:  [tokens 5500000000000000000] [value]
// Should sell:  [tokens 700000000000000000] [value]
// Should buy:  [tokens 150000000000000000] [value]
// Should sell: [tokens 35000000000000000] [value]

// Rates: 10**17, 5*10**17, 10**18, 10**19
// Balances: 10**18, 2*10**18, 5*10**17, 10**17
// Values 10**17, 10**18, 5*10**17, 10**18

// Total value 10**17+10**18+5*10**17+10**18 = 2.6*10**18
// Total value each: 6.5*10**17

// Should haveBalance each:
// 6.5*10**18
// 1.3*10**18
// 6.5*10**17
// 6.5*10**16

// Should buy [tokens 5.5*10**18] [value 5.5*10**17]
// Should sell [tokens 7*10**17] [value 3.5*10**17]
// Should buy [tokens 1.5*10**17] [value 1.5*10**17]
// Should sell [tokens 3.5*10**16] [value 3.5*10**17]

// 1. Use [7*10**17] tokens valued at [3.5*10**17] of (2) to buy [3.5*10**18] tokens valued at [3.5*10**17] of (1)
// 2. Use [2*10**16] tokens valued at [2*10**17] of (4) to buy [2*10**18] tokens valued at [2*10**17] of (1)
// 3. Use [1.5*10**16] tokens valued at [1.5*10**17] of (4) to buy [1.5*10**17] tokens valued at [1.5*10**17] of (3)
    enum RebalanceStatus { Initial, Calculated }
    mapping(address => RebalanceStatus) public rebalanceStatus;

    constructor(PriceProviderInterface _priceProvider) public {
        priceProvider = _priceProvider;
    }

    function rebalanceGetTokensToSellAndBuy(uint _rebalanceDeltaPercentage) external returns (bool) {
        if(rebalanceStatus[msg.sender] == RebalanceStatus.Calculated) {
            return (
                true
            );
        }
        require(payFee(0), "Fee cannot be paid");

        uint i;
        uint j;
        uint totalValue;
        address[] memory indexTokenAddresses;
        uint[] memory indexTokenWeights;
        (indexTokenAddresses, indexTokenWeights) = IndexInterface(msg.sender).getTokens();
        uint[] memory indexTokenBalances = new uint[](indexTokenAddresses.length);
        uint[] memory indexTokenValues = new uint[](indexTokenWeights.length);
        uint[] memory prices;
        (prices, ,) = priceProvider.getMultiplePricesOrCacheFallback(castToERC20Extended(indexTokenAddresses), priceTimeout);
        for(i = 0; i < indexTokenBalances.length; i++){
            ERC20Extended indexToken = ERC20Extended(indexTokenAddresses[i]);
            uint decimals = indexToken.decimals();
            uint amount = indexToken.balanceOf(msg.sender);
              // 18 - token decimals to account for the returned rate in Kyber, which is always 18 decimals
              // Even if the token is, for example, only 4 decimals
            totalValue = totalValue.add(amount.mul(10**(18+18-decimals)).div(prices[i]));
            indexTokenBalances[i] = amount;
            indexTokenValues[i] = amount.mul(10**(18+18-decimals)).div(prices[i]);
        }
        uint totalValueEach = totalValue.div(indexTokenBalances.length);
        address[] storage tokensToSell;
        uint[] storage valueOfTokensToSell;
        address[] storage tokensToBuy;
        uint[] storage valueOfTokensToBuy;
        for(i = 0; i < indexTokenAddresses.length; i++){
            if(indexTokenValues[i] > totalValueEach){
                tokensToSell.push(indexTokenAddresses[i]);
                valueOfTokensToSell.push(indexTokenValues[i] - totalValueEach);
            } else {
                tokensToBuy[i] = indexTokenAddresses[i];
                valueOfTokensToBuy.push(indexTokenValues[i] - totalValueEach);
            }
        }
        for(i = 0; i < tokensToSell.length; i++) {
            for(j = 0; j < tokensToBuy.length; j++){
                if(valueOfTokensToSell[i] == 0){
                    break;
                }
                if(valueOfTokensToBuy[j] > 0){
                    uint val = valueOfTokensToSell[i] > valueOfTokensToBuy[j] ? valueOfTokensToBuy[j] : valueOfTokensToSell[i];
                    sourceTokens.push(tokensToSell[i]);
                    destTokens.push(tokensToBuy[j]);
                    // TODO GET CORRECT PRICES
                    srcAmount.push(val.mul(prices[i]).div(10**(18+18-decimals)));
                    valueOfTokensToBuy[j] = valueOfTokensToBuy[j].sub(val);
                    valueOfTokensToSell[i] = valueOfTokensToSell[i].sub(val);
                }
            }
        }
        return true;
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
