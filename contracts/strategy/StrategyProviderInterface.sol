pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract StrategyProviderInterface is Provider, Ownable {
    event StrategyChanged(uint strategyId);

   // To core smart contract
    function getStrategies() external returns (uint[] ids, string[] names, string[] descriptions);

    function getStrategy(uint strategyId) external returns (
        string name, 
        address owner, 
        string description, 
        address[] tokens, 
        uint[] weights);

   // To clients
    function createStrategy(
        string name, 
        string description, 
        address[] tokenAddresses, 
        uint[] weights, 
        bool isPrivate, 
        uint priceInMot) 
        public returns (uint strategyId);

    function updateStrategy(
        uint strategyId, 
        string description, 
        address[] tokenAddresses, 
        uint[] weights, 
        bool isPrivate, 
        uint priceInMot) 
        public returns (bool success);

    // increment statistics
    // function incrementStatistics(uint id, uint amountInEther) external returns (bool success);        
}
