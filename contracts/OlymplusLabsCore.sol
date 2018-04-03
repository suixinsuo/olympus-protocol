pragma solidity ^0.4.19;
// pragma experimental ABIEncoderV2;

import "./libs/Manageable.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";
import "./exchange/ExchangeProviderInterface.sol";
import "./price/PriceProviderInterface.sol";
import "./strategy/StrategyProviderInterface.sol";
import { TypeDefinitions as TD, Provider } from "./libs/Provider.sol";


contract OlymplusLabsCore is Manageable {
    using SafeMath for uint256;

    event IndexOrderUpdated (uint orderId);

    event Log(string message);
    event LogNumber(uint number);
    event LogAddress(address message);
    event LogAddresses(address[] message);
    event LogNumbers(uint[] numbers);

    ExchangeProviderInterface internal exchangeProvider =  ExchangeProviderInterface(address(0x00b31e55fec5704a9b09cf2c1ba65a276ec7a453b1));
    StrategyProviderInterface internal strategyProvider = StrategyProviderInterface(address(0x44F961821Bdb76eB2D8B06193F86f64a4C2bBDb8));
    PriceProviderInterface internal priceProvider = PriceProviderInterface(address(0x0088c80fcaae06323e17ddcd4ff8e0fbe06d9799e6));
    mapping (uint => IndexOrder) public orders;
    mapping(uint => mapping(address => uint)) public orderTokenAmounts;
    uint public feePercentage = 100;
    uint public constant DENOMINATOR = 10000;
    uint public orderId = 1000000;

    uint public minimumInWei = 0;
    uint public maximumInWei;

    modifier allowProviderOnly(TD.ProviderType _type) {
        require(msg.sender == subContracts[uint8(_type)]);
        _;
    }

    struct IndexOrder {
        address buyer;
        uint64 strategyId;
        uint amountInWei;
        uint feeInWei;
        uint dateCreated;
        uint dateCompleted;
        address[] tokens;
        uint[] weights;
        uint[] estimatedPrices;
        uint[] dealtPrices;
        uint[] totalTokenAmounts;
        uint[] completedTokenAmounts;
        ExchangeProviderInterface.MarketOrderStatus[] subStatuses;
        OrderStatus status;
        bytes32 exchangeId;
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
    function getStrategyCount() public view returns (uint length)
    {
        return strategyProvider.getStrategyCount();
    }

    function getStrategy(uint strategyId) public view returns (
        string name,
        string description,
        string category,
        uint followers,
        uint amount,
        string exchangeName,
        uint tokenLength)
    {

        require(strategyId >= 0);

        bytes32[4] memory bytesTemp;

        (,bytesTemp[0], bytesTemp[1], bytesTemp[2], followers, amount, bytesTemp[3]) = strategyProvider.getStrategy(strategyId);
        name = Converter.bytes32ToString(bytesTemp[0]);
        description = Converter.bytes32ToString(bytesTemp[1]);
        category = Converter.bytes32ToString(bytesTemp[2]);
        exchangeName = Converter.bytes32ToString(bytesTemp[3]);

        tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
    }

    function getStrategyTokenAndWeightByIndex(uint strategyId, uint index) public view returns (
        address token,
        uint weight
        )
    {
        require(strategyId >= 0);

        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
        require(index < tokenLength);

        (token, weight) = strategyProvider.getStrategyTokenByIndex(strategyId, index);
    }

    // Forward to Price smart contract.
    function getPrice(address tokenAddress) public view returns (uint price){
        require(tokenAddress != address(0));
        return priceProvider.getNewDefaultPrice(tokenAddress);
    }

    function getStragetyTokenPrice(uint strategyId, uint tokenIndex) public view returns (uint price) {
        require(strategyId != 0);
        uint totalLength;

        (,,,,,totalLength) = getStrategy(strategyId);
        require(tokenIndex < totalLength);

        address token;
        (token,) = getStrategyTokenAndWeightByIndex(strategyId, tokenIndex);

        return getPrice(token);
    }

    function setProvider(uint8 _name, address _providerAddress) public onlyOwner returns (bool success) {
        bool result = super.setProvider(_name, _providerAddress);
        TD.ProviderType _type = TD.ProviderType(_name);

        if(_type == TD.ProviderType.Strategy) {
            Log("StrategyProvider");
            strategyProvider = StrategyProviderInterface(_providerAddress);
        } else if(_type == TD.ProviderType.Exchange) {
            Log("ExchangeProvider");
            exchangeProvider = ExchangeProviderInterface(_providerAddress);
        } else if(_type == TD.ProviderType.Price) {
            Log("PriceProvider");
            priceProvider = PriceProviderInterface(_providerAddress);
        } else {
            Log("Unknow provider tyep supplied.");
            revert();
        }

        return result;
    }

    function buyIndex(uint strategyId, address depositAddress) public payable returns (uint indexOrderId)
    {
        require(msg.value > minimumInWei);
        if(maximumInWei > 0){
            require(msg.value <= maximumInWei);
        }
        string memory exchangeName;
        (,,,,,exchangeName,) = getStrategy(strategyId);
        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);

        // can't buy an index without tokens.
        require(tokenLength > 0);

        uint[3] memory amounts;
        amounts[0] = msg.value; //uint totalAmount
        amounts[1] = getFeeAmount(amounts[0]); // fee
        amounts[2] = amounts[0] - amounts[1]; // actualAmount

        // create order.
        indexOrderId = getOrderId();

        uint[][4] memory subOrderTemp;
        // 0: token amounts
        // 1: estimatedPrices
        // 2: dealtPrices
        // 3: completedTokenAmounts
        bytes32 exchangeId = Converter.stringToBytes32(exchangeName);
        ExchangeProviderInterface.MarketOrderStatus[] memory statuses;

        address[] memory tokens = new address[](tokenLength);
        uint[] memory weights = new uint[](tokenLength);

        subOrderTemp[0] = initializeArray(tokenLength);
        subOrderTemp[1] = initializeArray(tokenLength);
        subOrderTemp[2] = initializeArray(tokenLength);
        subOrderTemp[3] = initializeArray(tokenLength);

        IndexOrder memory order = IndexOrder({
            strategyId: uint64(strategyId),
            buyer: msg.sender,
            amountInWei: amounts[0],
            feeInWei: amounts[1],
            status: OrderStatus.New,
            dateCreated: now,
            dateCompleted: 0,
            tokens: tokens,
            weights: weights,
            totalTokenAmounts: subOrderTemp[0],
            estimatedPrices: subOrderTemp[1],
            dealtPrices: subOrderTemp[2],
            completedTokenAmounts: subOrderTemp[3],
            subStatuses: statuses,
            exchangeId: exchangeId
        });

        LogNumber(indexOrderId);
        require(exchangeProvider.startPlaceOrder(indexOrderId, depositAddress));
        for (uint i = 0; i < tokenLength; i ++ ) {
            (tokens[i],weights[i]) = getStrategyTokenAndWeightByIndex(strategyId, i);
            // token has to be supported by exchange provider.
            if(!exchangeProvider.checkTokenSupported(tokens[i])){
                Log("Exchange provider doesn't support");
                revert();
            }

            // check if price provider supports it.
            if(!priceProvider.checkTokenSupported(tokens[i])){
                Log("Price provider doesn't support");
                revert();
            }

            // ignore those tokens with zero weight.
            if(weights[i] <= 0) {
                continue;
            }

            subOrderTemp[0][i] = amounts[2] * weights[i] / 100;
            subOrderTemp[1][i] = getPrice(tokens[i]);

            orderTokenAmounts[indexOrderId][tokens[i]] = subOrderTemp[0][i];

            LogAddress(tokens[i]);
            LogNumber(subOrderTemp[0][i]);
            LogNumber(subOrderTemp[1][i]);
            require(exchangeProvider.addPlaceOrderItem(indexOrderId, tokens[i], subOrderTemp[0][i], subOrderTemp[1][i]));
        }

        LogNumber(amounts[2]);
        require((exchangeProvider.endPlaceOrder.value(amounts[2])(indexOrderId)));

        orders[indexOrderId] = order;

        // todo: send ethers to the clearing center.
        return indexOrderId;
    }

    function initializeArray(uint length) private pure returns (uint[]){
        return new uint[](length);
    }

    // For app/3rd-party clients to check details / status.
    function getIndexOrder(uint _orderId) public view returns (
        uint strategyId,
        address buyer,
        OrderStatus status,
        uint dateCreated,
        uint dateCompleted,
        uint amountInWei,
        address[] tokens,
        bytes32 exchangeId
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
            order.tokens,
            order.exchangeId
        );
    }

    function updateIndexOrderToken(
        uint _orderId,
        address _tokenAddress,
        uint _actualPrice,
        uint _totalTokenAmount,
        uint _completedQuantity
    ) external allowProviderOnly(TD.ProviderType.Exchange)  returns (bool success)
    {
        IndexOrder memory order = orders[_orderId];
        int index = -1;
        for(uint i = 0 ; i < order.tokens.length; i ++){
            if(order.tokens[i] == _tokenAddress) {
                index = int(i);
                break;
            }
        }

        if(index == -1) {
            // token not found.
            revert();
        }

        ExchangeProviderInterface.MarketOrderStatus status;

        if(order.completedTokenAmounts[uint(index)] == 0 && _completedQuantity < order.completedTokenAmounts[uint(index)]){
            status = ExchangeProviderInterface.MarketOrderStatus.PartiallyCompleted;
        }

        if(_completedQuantity >= order.completedTokenAmounts[uint(index)]){
            status = ExchangeProviderInterface.MarketOrderStatus.Completed;
        }

        order.totalTokenAmounts[uint(index)] = _totalTokenAmount;
        order.dealtPrices[uint(index)] = _actualPrice;
        order.completedTokenAmounts[uint(index)] = _completedQuantity;


        order.subStatuses[uint(index)];

        orders[_orderId] = order;

        return true;
    }

    function updateOrderStatus(uint _orderId, OrderStatus _status)
        external allowProviderOnly(TD.ProviderType.Exchange)
        returns (bool success)
    {
        IndexOrder memory order = orders[_orderId];
        order.status = _status;
        orders[_orderId] = order;

        return true;
    }

    function getSubOrderStatus(uint _orderId, address _tokenAddress)
        external view returns (ExchangeProviderInterface.MarketOrderStatus)
    {
        return exchangeProvider.getSubOrderStatus(_orderId, _tokenAddress);
    }

    function ajustFee(uint _newFeePercentage) public onlyOwner returns (bool success) {
        feePercentage = _newFeePercentage;
        return true;
    }

    function adjustTradeRange(uint _minInWei, uint _maxInWei) public onlyOwner returns (bool success) {
        require(_minInWei > 0);
        require(_maxInWei > _minInWei);
        minimumInWei = _minInWei;
        maximumInWei = _maxInWei;

        return true;
    }

    function resetOrderIdTo(uint _start) public onlyOwner returns (uint) {
        orderId = _start;
        return orderId;
    }

    function getOrderId() private returns (uint) {
        return orderId++;
    }

    function getFeeAmount(uint amountInWei) private view returns (uint){
        return amountInWei * feePercentage / DENOMINATOR;
    }
}
