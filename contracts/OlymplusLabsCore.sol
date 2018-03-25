pragma solidity ^0.4.18;
pragma experimental ABIEncoderV2;

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

    event IndexOrderUpdated (bytes32 orderId);
    event Log(string message);

    ExchangeProviderInterface internal exchangeProvider;
    StrategyProviderInterface internal strategyProvider;
    PriceProviderInterface internal priceProvider;
    mapping (bytes32 => IndexOrder) public orders;  
    mapping(bytes32 => mapping(address => uint)) public orderTokenAmounts; 
    uint public feePercentage; 
    // approve limit for tokens;
    mapping (address => uint) public approvalLimit;
    uint internal orderId;

    struct IndexOrder {
        address buyer;      
        uint64 strategyId;
        uint amountInWei;
        uint feeInWei;
        uint dateCreated;
        uint dateCompleted;
        address[] tokens;
        uint[] weights;
        OrderStatus status;        
    }

    enum OrderStatus {
        New,
        Placed,
        PartiallyCompleted,
        Completed,
        Cancelled,
        Errored
    }

    function() payable public {
        revert();
    }

    // Forward to Strategy smart contract.
    function getStrategies() public returns (
        bytes32[] names,
        bytes32[] descriptions,
        bytes32[] categories,
        address[][] tokens,
        uint[][] tokenWeights,
        uint[] followers,
        uint[] amounts)
    {
        strategyProvider = (StrategyProviderInterface)(getProvider(TD.ProviderType.Strategy));
        
        string[3] memory stringTemp;
        uint[4] memory uintTemp;
        address[] memory indexTokens;
        uint[] memory indexWeights;
        
        uintTemp[0] = strategyProvider.getStrategyCount();

        for(uint i = 0; i < uintTemp[0]; i++) {
            (stringTemp[0], stringTemp[1],stringTemp[2],indexTokens,indexWeights,uintTemp[2], uintTemp[3]) 
            = getStrategy(i);

            names[i] = Converter.stringToBytes32(stringTemp[0]);
            descriptions[i] = Converter.stringToBytes32(stringTemp[1]);
            categories[i] = Converter.stringToBytes32(stringTemp[2]);
            followers[i] = uintTemp[2];
            amounts[i] = uintTemp[3];
            tokens[i] = indexTokens;
            tokenWeights[i] = indexWeights;
        }
    }

    function getStrategy(uint strategyId) public returns (
        string name,
        string description,
        string category,
        address[] tokens,
        uint[] weights,
        uint followers,
        uint amount)
    {
        require(strategyId != 0);
        strategyProvider = (StrategyProviderInterface)(getProvider(TD.ProviderType.Strategy));

        bytes32[3] memory bytesTemp;

        (,bytesTemp[0], bytesTemp[1], bytesTemp[2], followers, amount) = strategyProvider.getStrategy(strategyId);
        name = Converter.bytes32ToString(bytesTemp[0]);
        description = Converter.bytes32ToString(bytesTemp[1]);
        category = Converter.bytes32ToString(bytesTemp[2]);
        
        address token;
        uint weight;

        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
        for (uint i = 0; i < tokenLength; i++) {
            (token, weight) = strategyProvider.getStrategyTokenByIndex(strategyId, i);
            tokens[i] = token;
            weights[i] = weight;
        }
    }

    // Forward to Price smart contract.
    function getPrice(address tokenAddress) public returns (uint price){
        require(tokenAddress != address(0));
        /* emit */Log("Start calling price provider");
        priceProvider = (PriceProviderInterface)(getProvider(TD.ProviderType.Price));
        /* emit */Log("Provider created.");
        price = priceProvider.getPrice(tokenAddress);
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

        (,,,tokens,,,) = getStrategy(strategyId);
        return getPrices(tokens);
    }

    function getProvider(TD.ProviderType _type) internal returns (Provider provider) {
        address providerAddress = subContracts[uint8(_type)];
        require(providerAddress != address(0));
        if(_type == TD.ProviderType.Strategy) {
            /* emit */Log("StrategyProvider");
            return StrategyProviderInterface(providerAddress);
        }
        if(_type == TD.ProviderType.Exchange) {
            /* emit */Log("ExchangeProvider");
            return ExchangeProviderInterface(providerAddress);
        }
        if(_type == TD.ProviderType.Price) {
            /* emit */Log("PriceProvider");
            return PriceProviderInterface(providerAddress);
        }

        /* emit */Log("Boom!");
        revert();
    }

   // Send to Exchange smart contract after validation and splitted to sub orders.
    function buyIndex(uint strategyId, address depositAddress)
        public payable returns (bytes32 indexOrderId){
        
        address[] memory tokens;
        uint[] memory weights;
        
        (,,,tokens,weights,,) = getStrategy(strategyId);
        uint[3] memory amounts;
        amounts[0] = msg.value; //uint totalAmount 
        amounts[1] = amounts[0] * feePercentage; // fee
        amounts[2] = amounts[0] - amounts[1]; // actualAmount 

        // create order.
        indexOrderId = getOrderIdHash();

        uint[] memory tokenAmounts;
        uint[] memory prices;

        IndexOrder memory order = IndexOrder({
            strategyId: uint64(strategyId),
            buyer: msg.sender,          
            amountInWei: amounts[0],
            feeInWei: amounts[1],
            status: OrderStatus.New,
            dateCreated: now,
            dateCompleted: 0,
            tokens: tokens,
            weights: weights
        });
        
        ExchangeProviderInterface provider = (ExchangeProviderInterface)(getProvider(TD.ProviderType.Exchange));

        for (uint i = 0; i < tokens.length; i ++ ) {
            tokenAmounts[i] = amounts[2] * (weights[i] / 100);

            // check approval limit.
            if(approvalLimit[tokens[i]] < tokenAmounts[i]) {
              // call exchange provider to increase approval limit.
              bool result = provider.approve(tokens[i], tokenAmounts[i]);
              require(result);
            }

            prices[i] = getPrice(tokens[i]);
            orderTokenAmounts[indexOrderId][tokens[i]] = tokenAmounts[i];
        }

        address deposit = depositAddress == address(0) ? order.buyer : depositAddress;
        provider.placeOrder(indexOrderId, tokens, tokenAmounts, prices, deposit);
        orders[indexOrderId] = order;

        // todo: send ethers to the clear center.

        return indexOrderId;
    }



    // For app/3rd-party clients to check details / status.
    function getIndexOrder(bytes32 _orderId) public view returns (
        uint strategyId,
        address buyer,
        OrderStatus status,
        uint dateCreated,
        uint dateCompleted,
        uint amountInWei,        
        address[] tokens       
        )
    {
        IndexOrder memory order = orders[_orderId];
        return (
            order.strategyId,
            order.buyer,
            order.status,
            order.dateCreated,
            order.dateCompleted,
            order.amountInWei,
            order.tokens
        );
    }

    function ajustFee(uint _newFeePercentage) public onlyOwner returns (bool success) {
      feePercentage = _newFeePercentage;
      return true;
    }

    function getOrderIdHash() public returns (bytes32) {
      return keccak256(orderId++);
    }
}