pragma solidity ^0.4.22;

import "./StrategyProviderInterface.sol";
import "../permission/PermissionProviderInterface.sol";
import "../libs/Converter.sol";

contract StrategyProvider is StrategyProviderInterface {
    event StrategyChanged(uint strategyId);

    address owner;

    mapping(address => uint[]) public comboIndex;
    mapping(uint => address) public comboOwner;
    mapping(address => bool) public StrategyWhiteList;
    event ComboCreated(uint id, string name);
    event ComboUpdated(uint id, string name);

    PermissionProviderInterface internal permissionProvider;
    address coreAddress;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyWhitelist() {
        require(StrategyWhiteList[msg.sender]);
        _;
    }
    modifier onlyCore() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }

    function changeWhitelist(address[] whitelistaddress) public onlyOwner {
        for (uint index = 0; index < whitelistaddress.length; index++) {
            if (StrategyWhiteList[whitelistaddress[index]]) {
                StrategyWhiteList[whitelistaddress[index]] = false;
            } else {
                StrategyWhiteList[whitelistaddress[index]] = true;
            }
        }
    }

    function StrategyProvider(address _permissionProvider, address _core) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
        coreAddress = _core;
        owner = msg.sender;
        StrategyWhiteList[owner] = true;
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
        string name,
        string description,
        string category,
        address[] memory tokenAddresses,
        uint[] memory weights,
        uint follower,
        uint amount,
        bytes32 exchangeId)
    {
        uint leng = comboHub[_index].tokenAddresses.length;
        Combo memory combo = comboHub[_index];
        tokenAddresses = new address[](leng);
        weights = new uint[](leng);
        // address owner = comboOwner[_index];
        for (uint i = 0; i < leng; i++) {
            tokenAddresses[i] = comboHub[_index].tokenAddresses[i];
            weights[i] = comboHub[_index].weights[i];
        }
        return (
            combo.id,
            combo.name,
            combo.description,
            combo.category,
            tokenAddresses,
            weights,
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
        public onlyWhitelist returns(uint)
    {
        address _owner = msg.sender;
        require(_checkCombo(_tokenAddresses, _weights));
        uint comboId = comboIndex[msg.sender].length;
        Combo memory myCombo = Combo(comboId, _name, _description, _category, _tokenAddresses, _weights, 0, 0, _exchangeId);

        emit ComboCreated(myCombo.id, myCombo.name);

        uint index = comboHub.push(myCombo) - 1;

        comboOwner[index] = _owner;
        comboIndex[_owner].push(index);

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
        public onlyWhitelist returns  (bool success)
    {
        require(_checkCombo(_tokenAddresses, _weights));
        // require(isOwner(_index));
        require(msg.sender == comboOwner[_index]);

        comboHub[_index].name = _name;
        comboHub[_index].description = _description;
        comboHub[_index].category = _category;
        comboHub[_index].tokenAddresses = _tokenAddresses;
        comboHub[_index].weights = _weights;
        comboHub[_index].exchangeId = _exchangeId;

        emit ComboUpdated(comboHub[_index].id, comboHub[_index].name);
        return true;
    }


    function incrementStatistics(uint _index, uint _amountInEther) external  onlyCore returns (bool success){
        comboHub[_index].amount += _amountInEther;
        return true;
    }

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
