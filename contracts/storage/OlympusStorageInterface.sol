pragma solidity ^0.4.19;
import "../exchange/ExchangeProviderInterface.sol";
// import "../libs/Ownable.sol";
import { StorageTypeDefinitions as STD } from "./OlympusStorage.sol";

contract OlympusStorageInterface {

    function addTokenDetails(
        uint indexOrderId, address token, uint weight, uint estimatedPrice,
        uint dealtPrice,uint totalTokenAmount,uint completedTokenAmount) external;

    function addOrderBasicFields(
        uint strategyId,
        address buyer,
        uint amountInWei,
        uint feeInWei,
        bytes32 exchangeId) external returns (uint indexOrderId);

    function getOrderTokenCompletedAmount(
        uint _orderId,
        address _tokenAddress) external view returns (uint, uint);

    function getIndexOrder1(uint _orderId) external view returns(
        uint strategyId,
        address buyer,
        STD.OrderStatus status,
        uint dateCreated
        );

    function getIndexOrder2(uint _orderId) external view returns(
        uint dateCompleted,
        uint amountInWei,
        uint tokensLength,
        bytes32 exchangeId
        );

    function updateIndexOrderToken(
        uint _orderId,
        uint _tokenIndex,
        uint _actualPrice,
        uint _totalTokenAmount,
        uint _completedQuantity,
        ExchangeProviderInterface.MarketOrderStatus status) external;

    function getIndexToken(uint _orderId, uint tokenPosition) external view returns (address token);

    function updateOrderStatus(uint _orderId, STD.OrderStatus _status)
        external returns (bool success);

    function resetOrderIdTo(uint _orderId) external returns(uint);

    function addCustomField(
        uint _orderId,
        bytes32 key,
        bytes32 value
        ) external returns (bool success);

    function getCustomField(
        uint _orderId,
        bytes32 key
        ) external view returns (bytes32 result);
}
