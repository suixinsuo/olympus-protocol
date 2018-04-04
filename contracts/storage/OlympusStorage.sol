pragma solidity ^0.4.19;


import "../exchange/ExchangeProviderInterface.sol";
import "./OlympusStorageInterface.sol";
import "../libs/Ownable.sol";
import "../libs/SafeMath.sol";

library StorageTypeDefinitions {
    enum OrderStatus {
        New,
        Placed,
        PartiallyCompleted,
        Completed,
        Cancelled,
        Errored
    }
}

contract OlympusStorage is Ownable, OlympusStorageInterface {
    using SafeMath for uint256;

    event IndexOrderUpdated (uint orderId);

    struct IndexOrder {
        address buyer;
        uint strategyId;
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
        StorageTypeDefinitions.OrderStatus status;
        bytes32 exchangeId;
    }
    mapping(uint => IndexOrder) public orders;
    mapping(uint => mapping(address => uint)) public orderTokenAmounts;
    uint public orderId = 1000000;

    function addTokenDetails(
        uint indexOrderId,
        address token,
        uint weight,
        uint estimatedPrice,
        uint dealtPrice,
        uint totalTokenAmount,
        uint completedTokenAmount
    ) public {
        orders[indexOrderId].tokens.push(token);
        orders[indexOrderId].weights.push(weight);
        orders[indexOrderId].estimatedPrices.push(estimatedPrice);
        orders[indexOrderId].dealtPrices.push(dealtPrice);
        orders[indexOrderId].totalTokenAmounts.push(totalTokenAmount);
        orders[indexOrderId].completedTokenAmounts.push(completedTokenAmount);
        orders[indexOrderId].subStatuses.push(ExchangeProviderInterface.MarketOrderStatus.Pending);
        orderTokenAmounts[indexOrderId][token] = weight;
    }

    function addOrderBasicFields(
        uint strategyId,
        address buyer,
        uint amountInWei,
        uint feeInWei,
        bytes32 exchangeId
        ) public returns (uint indexOrderId) {
        indexOrderId = getOrderId();

        IndexOrder memory order = IndexOrder({
            buyer: buyer,
            strategyId: strategyId,
            amountInWei: amountInWei,
            feeInWei: feeInWei,
            dateCreated: now,
            dateCompleted: 0,
            tokens: new address[](0),
            weights: new uint[](0),
            estimatedPrices: new uint[](0),
            dealtPrices: new uint[](0),
            totalTokenAmounts: new uint[](0),
            completedTokenAmounts: new uint[](0),
            subStatuses: new ExchangeProviderInterface.MarketOrderStatus[](0),
            status: StorageTypeDefinitions.OrderStatus.New,
            exchangeId: exchangeId
        });

        orders[indexOrderId] = order;
        return indexOrderId;
    }

    function getIndexOrder1(uint _orderId) public view returns(
        uint strategyId,
        address buyer,
        StorageTypeDefinitions.OrderStatus status,
        uint dateCreated
        ) {
        IndexOrder memory order = orders[_orderId];
        return (
            order.strategyId,
            order.buyer,
            order.status,
            order.dateCreated
        );
    }
    function getIndexOrder2(uint _orderId) public view returns(
        uint dateCompleted,
        uint amountInWei,
        uint tokensLength,
        bytes32 exchangeId
        ) {
        IndexOrder memory order = orders[_orderId];
        return (
            order.dateCompleted,
            order.amountInWei,
            order.tokens.length,
            order.exchangeId
        );
    }

    function getIndexToken(uint _orderId, uint tokenPosition) public view returns (address token){
        IndexOrder memory order = orders[_orderId];
        return order.tokens[tokenPosition];
    }

    function getOrderTokenCompletedAmount(uint _orderId, address _tokenAddress) external view returns (uint, uint){
        IndexOrder memory order = orders[_orderId];

        int index = -1;
        for(uint i = 0 ; i < order.tokens.length; i++){
            if(order.tokens[i] == _tokenAddress) {
                index = int(i);
                break;
            }
        }

        if(index == -1) {
            // token not found.
            revert();
        }

        return (order.completedTokenAmounts[uint(index)], uint(index));
    }

    function updateIndexOrderToken(
        uint _orderId,
        uint _tokenIndex,
        uint _actualPrice,
        uint _totalTokenAmount,
        uint _completedQuantity,
        ExchangeProviderInterface.MarketOrderStatus status) public{
        IndexOrder memory order = orders[_orderId];

        order.totalTokenAmounts[_tokenIndex] = _totalTokenAmount;
        order.dealtPrices[_tokenIndex] = _actualPrice;
        order.completedTokenAmounts[_tokenIndex] = _completedQuantity;
        order.subStatuses[_tokenIndex] = status;

        orders[_orderId] = order;

    }

    function updateOrderStatus(uint _orderId, StorageTypeDefinitions.OrderStatus _status)
        public returns (bool success){

        IndexOrder memory order = orders[_orderId];
        order.status = _status;
        orders[_orderId] = order;

        return true;
    }

    function getOrderId() private returns (uint) {
        return orderId++;
    }

    function resetOrderIdTo(uint _start) public onlyOwner returns (uint) {
        orderId = _start;
        return orderId;
    }

}
