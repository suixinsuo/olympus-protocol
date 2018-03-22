pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract StrategyProviderInterface is Provider, Ownable {

    struct Combo {
        uint id;
        string name;
        string description;
        string category;
        bool isPrivate;      // false --> public/ true --> private
        address[] tokenAddresses;
        uint[] weights;      //total is 100
        uint follower;
        uint amount;
    }

    Combo[] public comboHub;

    mapping(address => uint[]) public comboIndex;
    mapping(uint => address) public comboOwner;

    event ComboCreated(uint id, string name);
    event ComboUpdated(uint id, string name);

    modifier _checkIndex(uint _index) {
        require(_index < comboHub.length);
        _;
    }

    event StrategyChanged(uint strategyId);

   // To core smart contract
    function getStrategies(address _owner) public view returns (uint[] ids);
    function getMyStrategies() public view returns (uint[] ids);

    function getStrategy(uint _index) public _checkIndex(_index)  view returns (
        uint id, 
        string name, 
        string description, 
        string category,
        address indexOwner, 
        address[] tokenAddresses, 
        uint[] weights, 
        bool isPrivateIndex, 
        uint follower,
        uint amount);

   // To clients
    function createStrategy(
        string name, 
        string description, 
        string category,
        address[] tokenAddresses, 
        uint[] weights, 
        bool isPrivate) 
        public returns (uint strategyId);

    function updateStrategy(
        uint strategyId, 
        string name,
        string description,
        string category,
        bool isPricate, 
        address[] tokenAddresses, 
        uint[] weights) 
        public returns (bool success);

    // increment statistics
    //TODO atuh the core contract address
    function incrementStatistics(uint id, uint amountInEther) external returns (bool success);        
}
