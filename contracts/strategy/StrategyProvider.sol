pragma solidity ^0.4.18;

import "./StrategyProviderInterface.sol";
import "../permission/PermissionProviderInterface.sol";
import "../libs/Converter.sol";

contract StrategyProvider is StrategyProviderInterface {
    event StrategyChanged(uint strategyId);

    mapping(address => uint[]) public comboIndex;
    mapping(uint => address) public comboOwner;

    event ComboCreated(uint id, string name);
    event ComboUpdated(uint id, string name);

    PermissionProviderInterface internal permissionProvider;
    address coreAddress;

    modifier onlyCore() {
        require(msg.sender == coreAddress);
        _;
    }
    function StrategyProvider(address _permissionProvider, address _core) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider); 
        coreAddress = _core;
    }

    function getStrategyCount() public view returns (uint length){
        return comboHub.length;
    }


    function getStrategies(address _owner) public view returns (uint[]) {
        return comboIndex[_owner];
    }


    function getMyStrategies() public view returns (uint[]) {
        return comboIndex[msg.sender];
    }


    function getStrategyTokenCount(uint _index) public view returns (uint length){
        return comboHub[_index].tokenAddresses.length;
    }


    function getStrategyTokenByIndex(uint _index, uint tokenIndex) public view returns (address token, uint weight){
        return (comboHub[_index].tokenAddresses[tokenIndex], comboHub[_index].weights[tokenIndex]);
    }


    function getStrategy(uint _index) public _checkIndex(_index) view returns (
        uint id, 
        bytes32 name, 
        bytes32 description, 
        bytes32 category,
        uint follower,
        uint amount,
        bytes32 exchangeId) 
    {
        Combo memory combo = comboHub[_index];
        // address owner = comboOwner[_index];
        return (
            combo.id,
            Converter.stringToBytes32(combo.name),
            Converter.stringToBytes32(combo.description),
            Converter.stringToBytes32(combo.category),
            combo.follower,
            combo.amount,
            combo.exchangeId);
    }
    
    function createStrategy(
        string _name,
        string _description,
        string _category,
        address[] _tokenAddresses,
        uint[] _weights,
        bytes32 _exchangeId) 
        public returns(uint)
    {
        address owner = msg.sender;
        require(_checkCombo(_tokenAddresses, _weights));
        uint comboId = comboIndex[msg.sender].length;
        Combo memory myCombo = Combo(comboId, _name, _description, _category, _tokenAddresses, _weights, 0, 0, _exchangeId);

        emit ComboCreated(myCombo.id, myCombo.name);

        uint index = comboHub.push(myCombo) - 1;

        comboOwner[index] = owner;
        comboIndex[owner].push(index);

        return index;
    }

    function updateStrategy(
        uint _index, 
        string _name, 
        string _description, 
        string _category,
        address[] _tokenAddresses, 
        uint[] _weights,
        bytes32 _exchangeId) 
        public returns (bool success) 
    {
        require(_checkCombo(_tokenAddresses, _weights));
        // require(isOwner(_index));

        comboHub[_index].name = _name;
        comboHub[_index].description = _description;
        comboHub[_index].category = _category;
        comboHub[_index].tokenAddresses = _tokenAddresses;
        comboHub[_index].weights = _weights;
        comboHub[_index].exchangeId = _exchangeId;

        emit ComboUpdated(comboHub[_index].id, comboHub[_index].name);
        return true;
    }

    //TODO require core contract address
    function incrementStatistics(uint _index, uint _amountInEther) external  onlyCore returns (bool success){
        comboHub[_index].amount += _amountInEther;
        return true;
    }
    //TODO require core contract address
    function updateFollower(uint _index, bool follow) external onlyCore returns (bool success){
        if (follow) {
            comboHub[_index].follower ++;
        } else {
            comboHub[_index].follower --;
        }
        return true;
    }  

    function _checkCombo(address[] _tokenAddresses, uint[] _weights) internal pure returns(bool success) {
        require(_tokenAddresses.length == _weights.length);
        uint total = 0;
        for (uint i = 0; i < _weights.length; ++i) {
            total += _weights[i];
        }
        return total == 100;
    }


}
