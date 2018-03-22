pragma solidity ^0.4.18;

import "./libs/Ownable.sol";
import "./libs/Provider.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";
import "./exchange/ExchangeProviderInterface.sol";
import "./price/PriceProviderInterface.sol";
import "./strategy/StrategyProviderInterface.sol";
import { TypeDefinitions as TD, Provider } from "./libs/Provider.sol";


contract OlymplusLabsCore is Ownable {
    using SafeMath for uint256;

    event IndexOrderUpdated (string orderId);

    // this is used to hold the addresses of the providers.
    mapping (bytes32 => address) public subContracts;
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
        strategyProvider = (StrategyProviderInterface)(getProvider(TD.ProvderType.Strategy));
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
            for (uint j =0; j < tokenLength; j++) {
              address token; uint weight;
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

    function getStrategy(string strategyId) public view returns (string name, address[] tokens, uint[] weights);
    // Forward to Price smart contract.
    function getPrices(uint strategyId) public view returns (uint[] prices);
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

    function setProvider(TD.ProvderType _type, address _providerAddress) public onlyOwner returns (bool success) {
        require(_providerAddress != address(0));
        bytes32 key = keccak256(_type);
        subContracts[key] = _providerAddress;
        return true;
    }

    function getProvider(TD.ProvderType _type) internal view returns (Provider provider) {
        bytes32 key = keccak256(_type);
        address providerAddress = subContracts[key];
        require(providerAddress != address(0));
        if(_type == TD.ProvderType.Strategy) {
            return StrategyProviderInterface(providerAddress);
        }
        if(_type == TD.ProvderType.Exchange) {
            return ExchangeProviderInterface(providerAddress);
        }
        if(_type == TD.ProvderType.Price) {
            return PriceProviderInterface(providerAddress);
        }

        revert();
    }
}
