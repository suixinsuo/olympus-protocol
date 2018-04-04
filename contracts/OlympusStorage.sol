pragma solidity ^0.4.19;


import "./exchange/ExchangeProviderInterface.sol";
import "./libs/Ownable.sol";
import "./libs/SafeMath.sol";

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

contract OlympusStorage is Ownable {
    using SafeMath for uint256;

    event IndexOrderUpdated (uint orderId);

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
        orderTokenAmounts[indexOrderId][token] = weight;
    }

    function addOrderBasicFields(
        uint64 strategyId,
        address buyer,
        uint amountInWei,
        uint feeInWei,
        StorageTypeDefinitions.OrderStatus status,
        uint dateCreated,
        uint dateCompleted,
        bytes32 exchangeId
        ) public returns (uint indexOrderId) {
        indexOrderId = getOrderId();

        IndexOrder memory order = IndexOrder({
            buyer: buyer,
            strategyId: strategyId,
            amountInWei: amountInWei,
            feeInWei: feeInWei,
            dateCreated: dateCreated,
            dateCompleted: dateCompleted,
            tokens: new address[](0),
            weights: new uint[](0),
            estimatedPrices: new uint[](0),
            dealtPrices: new uint[](0),
            totalTokenAmounts: new uint[](0),
            completedTokenAmounts: new uint[](0),
            subStatuses: new ExchangeProviderInterface.MarketOrderStatus[](0),
            status: status,
            exchangeId: exchangeId
        });

        orders[indexOrderId] = order;
        return indexOrderId;
    }

    function updateOrder(
        address buyer,
        uint64 strategyId,
        uint amountInWei,
        uint feeInWei,
        uint dateCreated,
        uint dateCompleted,
        StorageTypeDefinitions.OrderStatus status) public {

    }

    function getOrder(uint selectedOrderId) public view returns(uint newOrderId) {
        //return orders[selectedOrderId];
        return newOrderId;
    }

    function getOrderId() private returns (uint) {
        return orderId++;
    }

}
