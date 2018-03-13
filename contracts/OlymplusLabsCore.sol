pragma solidity ^0.4.18;

import './libs/Ownable.sol';

contract OlymplusLabsCore is Ownable {
    event IndexOrderUpdated (string orderId);
    
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
    function getStrategies() public returns (uint[] ids, string[] names, string[] descriptions);
    function getStrategy(string strategyId) public returns (string name, address[] tokens, uint[] weights);
    // Forward to Price smart contract.
    function getPrices(uint strategyId) public returns (uint[] prices);
    // Send to Exchange smart contract after validation and splitted to sub orders.
    function buyIndex(uint strategyId, uint amountInEther, uint[] stopLimits, address depositAddress) public returns (string orderId);
        
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
}