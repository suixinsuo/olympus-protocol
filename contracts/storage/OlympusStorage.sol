pragma solidity ^0.4.23;

import "../exchange/ExchangeProviderInterface.sol";
import "./OlympusStorageExtendedInterface.sol";
import "./OlympusStorageInterface.sol";
import "../libs/Manageable.sol";
import "../libs/SafeMath.sol";
import { TypeDefinitions as TD, Provider } from "../libs/Provider.sol";
import "../permission/PermissionProviderInterface.sol";

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

contract OlympusStorage is Manageable, OlympusStorageInterface {
    using SafeMath for uint256;

    event IndexOrderUpdated (uint orderId);
    event Log(string message);

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
        ExchangeAdapterBase.OrderStatus[] subStatuses;
        StorageTypeDefinitions.OrderStatus status;
        bytes32 exchangeId;
    }
    mapping(uint => IndexOrder) public orders;
    mapping(uint => mapping(address => uint)) public orderTokenAmounts;
    uint public orderId = 1000000;
    bytes32 constant private dataKind = "Order";
    OlympusStorageExtendedInterface internal olympusStorageExtended = OlympusStorageExtendedInterface(address(0xcEb51bD598ABb0caa8d2Da30D4D760f08936547B));

    address coreAddress;

    // modifier onlyCore() {
    //     require(msg.sender == coreAddress || coreAddress == 0x0);
    //     _;
    // }

    modifier onlyOwner() {
        require(permissionProvider.hasStorageOwner(msg.sender));
        _;
    }
    modifier onlyCore() {
        require(permissionProvider.hasCore(msg.sender));
        _;
    }
    PermissionProviderInterface internal permissionProvider;
    constructor(address _permissionProvider, address _core) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
        coreAddress = _core;
    }

    function addTokenDetails(
        uint indexOrderId,
        address[] tokens,
        uint[] weights,
        uint[] totalTokenAmounts,
        uint[] estimatedPrices
    ) external onlyCore {
        orders[indexOrderId].tokens = tokens;
        orders[indexOrderId].weights = weights;
        orders[indexOrderId].estimatedPrices = estimatedPrices;
        orders[indexOrderId].totalTokenAmounts = totalTokenAmounts;
        uint i;
        for (i = 0; i < tokens.length; i++ ) {
            orders[indexOrderId].subStatuses.push(ExchangeAdapterBase.OrderStatus.Pending);
            orders[indexOrderId].dealtPrices.push(0);
            orders[indexOrderId].completedTokenAmounts.push(0);

            orderTokenAmounts[indexOrderId][tokens[i]] = weights[i];
        }
    }

    function addOrderBasicFields(
        uint strategyId,
        address buyer,
        uint amountInWei,
        uint feeInWei,
        bytes32 exchangeId
        ) external onlyCore returns (uint indexOrderId) {
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
            subStatuses: new ExchangeAdapterBase.OrderStatus[](0),
            status: StorageTypeDefinitions.OrderStatus.New,
            exchangeId: exchangeId
        });

        orders[indexOrderId] = order;
        return indexOrderId;
    }

    function getIndexOrder1(uint _orderId) external view returns(
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
    function getIndexOrder2(uint _orderId) external view returns(
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

    function getIndexToken(uint _orderId, uint tokenPosition) external view returns (address token){
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
        ExchangeAdapterBase.OrderStatus _status) external onlyCore {
        IndexOrder memory order = orders[_orderId];

        order.totalTokenAmounts[_tokenIndex] = _totalTokenAmount;
        order.dealtPrices[_tokenIndex] = _actualPrice;
        order.completedTokenAmounts[_tokenIndex] = _completedQuantity;
        order.subStatuses[_tokenIndex] = _status;

        orders[_orderId] = order;

    }

    function addCustomField(
        uint _orderId,
        bytes32 key,
        bytes32 value
    ) external onlyCore returns (bool success){
        return olympusStorageExtended.setCustomExtraData(dataKind,_orderId,key,value);
    }

    function getCustomField(
        uint _orderId,
        bytes32 key
    ) external view returns (bytes32 result){
        return olympusStorageExtended.getCustomExtraData(dataKind,_orderId,key);
    }

    function updateOrderStatus(uint _orderId, StorageTypeDefinitions.OrderStatus _status)
        external onlyCore returns (bool success){

        IndexOrder memory order = orders[_orderId];
        order.status = _status;
        orders[_orderId] = order;

        return true;
    }

    function getOrderId() private returns (uint) {
        return orderId++;
    }

    function resetOrderIdTo(uint _start) external onlyOwner returns (uint) {
        orderId = _start;
        return orderId;
    }

    function setProvider(uint8 _id, address _providerAddress) public onlyOwner returns (bool success) {
        bool result = super.setProvider(_id, _providerAddress);
        TD.ProviderType _type = TD.ProviderType(_id);

        if(_type == TD.ProviderType.ExtendedStorage) {
            emit Log("ExtendedStorage");
            olympusStorageExtended = OlympusStorageExtendedInterface(_providerAddress);
        } else {
            emit Log("Unknown provider type supplied.");
            revert();
        }

        return result;
    }


}
