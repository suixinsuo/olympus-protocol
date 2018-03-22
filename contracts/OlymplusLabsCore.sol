pragma solidity ^0.4.18;

import "./libs/Manageable.sol";
import "./libs/Provider.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";
import "./exchange/ExchangeProviderInterface.sol";
import "./price/PriceProviderInterface.sol";
import "./strategy/StrategyProviderInterface.sol";
import { TypeDefinitions as TD, Provider } from "./libs/Provider.sol";


contract OlymplusLabsCore is Manageable {
    using SafeMath for uint256;

    event IndexOrderUpdated (string orderId);

    ExchangeProviderInterface internal exchangeProvider;
    StrategyProviderInterface internal strategyProvider;
    PriceProviderInterface internal priceProvider;

    struct IndexOrder {
        string id;
        string strategyId;
        mapping (address => uint) tokenQuantities;
        OrderStatus status;
        uint dateCreated;
        uint dateCompleted;
    }

    enum OrderStatus {
        Placed,
        PartiallyCompleted,
        Completed,
        Cancelled,
        Errored
    }

    // Forward to Strategy smart contract.
    function getStrategies() public returns (
        string[] names,
        string[] descriptions,
        string[] categories,
        address[] indexOwners,
        address[][] tokens,
        uint[][] tokenWeights,
        bool[] isPrivates,
        uint[] followers,
        uint[] amounts)
    {
        strategyProvider = (StrategyProviderInterface)(getProvider(TD.ProviderType.Strategy));
        uint totalLength = strategyProvider.getStrategyCount();

        bytes32 name;
        bytes32 description;
        bytes32 category;
        address indexOwner;
        bool isPrivateIndex;
        uint strategyFollowers;
        uint amount;

        address[] memory tokenAddresses;
        uint[] memory weights;

        for(uint i = 0; i < totalLength; i++) {
            (, name, description, category, indexOwner, isPrivateIndex, strategyFollowers, amount) = strategyProvider.getStrategy(i);
            uint tokenLength = strategyProvider.getStrategyTokenCount(i);
            for (uint j = 0; j < tokenLength; j++) {
                address token;
                uint weight;

                (token, weight) = strategyProvider.getStrategyTokenByIndex(i, j);
                tokenAddresses[j] = token;
                weights[j] = weight;
            }

            names[i] = Converter.bytes32ToString(name);
            descriptions[i] = Converter.bytes32ToString(description);
            categories[i] = Converter.bytes32ToString(category);
            indexOwners[i] = indexOwner;
            isPrivates[i] = isPrivateIndex;
            followers[i] = strategyFollowers;
            amounts[i] = amount;
            tokens[i] = tokenAddresses;
            tokenWeights[i] = weights;
        }
    }

    function getStrategy(uint strategyId) public returns (
        uint id, // id of the strategy under the same owner.
        string name,
        string description,
        string category,
        address[] tokens,
        uint[] weights,
        address indexOwner,
        bool isPrivateIndex,
        uint followers,
        uint amount)
    {
        require(strategyId != 0);
        strategyProvider = (StrategyProviderInterface)(getProvider(TD.ProviderType.Strategy));

        bytes32 bytesName;
        bytes32 bytesDesc;
        bytes32 bytesCategory;

        (id, bytesName, bytesDesc, bytesCategory, indexOwner, isPrivateIndex, followers, amount) = strategyProvider.getStrategy(strategyId);
        name = Converter.bytes32ToString(bytesName);
        description = Converter.bytes32ToString(bytesDesc);
        category = Converter.bytes32ToString(bytesCategory);

        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
        for (uint i = 0; i < tokenLength; i++) {
            address token;
            uint weight;

            (token, weight) = strategyProvider.getStrategyTokenByIndex(strategyId, i);
            tokens[i] = token;
            weights[i] = weight;
        }
    }

    // Forward to Price smart contract.
    function getPrice(address tokenAddress) public returns (uint price){
        require(tokenAddress != address(0));
        priceProvider = (PriceProviderInterface)(getProvider(TD.ProviderType.Price));
        return priceProvider.getPrice(tokenAddress);
    }

    function getPrices(address[] addresses) public returns (uint[] prices) {
        priceProvider = (PriceProviderInterface)(getProvider(TD.ProviderType.Price));
        for (uint i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0));
            prices[i] = priceProvider.getPrice(addresses[i]);
        }
    }

    function getStragetyPrices(uint strategyId) public returns (uint[] prices) {
        require(strategyId != 0);
        address[] memory tokens;

        (,,,,tokens,,,,,) = getStrategy(strategyId);
        return getPrices(tokens);
    }

    // Send to Exchange smart contract after validation and splitted to sub orders.
    function buyIndex(uint strategyId, uint amountInEther, uint[] stopLimits, address depositAddress)
        public payable returns (string orderId);

    // For app/3rd-party clients to check details / status.
    function getIndexOrder(string orderId) public returns (
        string id,
        string strategyId,
        address[] tokens,
        uint[] quantities,
        OrderStatus status,
        uint dateCreated,
        uint dateCompleted
        );

    function getIndexStatus (string orderId) public returns (OrderStatus status);
    function cancelOrder(string orderId) public returns (bool success);

    function getProvider(TD.ProviderType _type) internal view returns (Provider provider) {
        bytes32 key = keccak256(_type);
        address providerAddress = subContracts[key];
        require(providerAddress != address(0));
        if(_type == TD.ProviderType.Strategy) {
            return StrategyProviderInterface(providerAddress);
        }
        if(_type == TD.ProviderType.Exchange) {
            return ExchangeProviderInterface(providerAddress);
        }
        if(_type == TD.ProviderType.Price) {
            return PriceProviderInterface(providerAddress);
        }

        revert();
    }
}
