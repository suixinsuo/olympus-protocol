pragma solidity ^0.4.18;

import "../libs/Provider.sol";


contract StrategyProviderInterface is Provider {

    struct Combo {
        uint id;
        string name;
        string description;
        string category;
        address[] tokenAddresses;
        uint[] weights;      //total is 100
        uint follower;
        uint amount;
        bytes32 exchangeId;
    }

    Combo[] public comboHub;
    modifier _checkIndex(uint _index) {
        require(_index < comboHub.length);
        _;
    }

   // To core smart contract
    function getStrategyCount() public view returns (uint length);

    // function getStrategies(address _owner) public view returns (uint[] ids);
    // function getMyStrategies() public view returns (uint[] ids);

    function getStrategyTokenCount(uint strategyId) public view returns (uint length);
    function getStrategyTokenByIndex(uint strategyId, uint tokenIndex) public view returns (address token, uint weight);

    function getStrategy(uint _index) public _checkIndex(_index) view returns (
        uint id, 
        string name, 
        string description, 
        string category,
        address[] memory tokenAddresses,
        uint[] memory weights,
        uint follower,
        uint amount,
        bytes32 exchangeId);

   // To clients
    function createStrategy(
        string name,
        string description,
        string category,
        address[] tokenAddresses,
        uint[] weights,
        bytes32 exchangeId)
        public returns (uint strategyId);

    function updateStrategy(
        uint strategyId,
        string name,
        string description,
        string category,
        address[] tokenAddresses,
        uint[] weights,
        bytes32 exchangeId)
        public returns (bool success);

    // increment statistics
    // TODO atuh the core contract address
    function incrementStatistics(uint id, uint amountInEther) external returns (bool success);
    function updateFollower(uint id, bool follow) external returns (bool success);
}
