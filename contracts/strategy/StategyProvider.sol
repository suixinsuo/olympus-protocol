pragma solidity ^0.4.18;

import "./StrategyProviderInterface.sol";


contract StrategyProvider is StrategyProviderInterface {
    struct Combo {
        uint id;
        string name;
        string description;
        bool isPrivate;      // false --> public/ true --> private
        address[] tokenAddresses;
        uint[] weights;      //total is 100
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

    function createStrategy(
        string _name,
        string _description,
        address[] _tokenAddresses,
        uint[] _weights,
        bool _isPrivate,
        uint priceInMot
    ) public returns(uint) 
    {

        address owner = msg.sender;
        require(_checkCombo(_tokenAddresses, _weights));
        uint comboId = comboIndex[msg.sender].length;
        Combo memory myCombo = Combo(comboId, _name, _description, _isPrivate, _tokenAddresses, _weights);

        ComboCreated(myCombo.id, myCombo.name);

        uint index = comboHub.push(myCombo) - 1;

        comboOwner[index] = owner;
        comboIndex[owner].push(index);

        return index;
    }

    function updateStrategy(
        uint _index, 
        string _name, 
        string _description, 
        bool _isPrivate, 
        address[] _tokenAddresses, 
        uint[] _weights, 
        uint _priceInMot) 
        public returns (bool success) 
    {

        // if (!_checkCombo(_tokenAddresses, _weights) || !isOwner(_index)) {
        require(_checkCombo(_tokenAddresses, _weights));
        require(isOwner(_index));
        
        comboHub[_index].name = _name;
        comboHub[_index].description = _description;
        comboHub[_index].isPrivate = _isPrivate;
        comboHub[_index].tokenAddresses = _tokenAddresses;
        comboHub[_index].weights = _weights;
        
        ComboUpdated(comboHub[_index].id, comboHub[_index].name);
        return true;
    }

    function isPrivate(uint _index) public _checkIndex(_index) view returns(bool) {
        return comboHub[_index].isPrivate;
    }

    function isOwner(uint _index) public _checkIndex(_index)  view returns(bool) {
        return comboOwner[_index] == msg.sender;
    }

    function getAllStrategyIndex() public view returns (uint[]) {
        return comboIndex[msg.sender];
    }

    function getStrategy(uint _index) public _checkIndex(_index)  view returns (
        uint id, 
        string name, 
        string description, 
        address indexOwner, 
        address[] tokenAddresses, 
        uint[] weights, 
        bool isPrivateIndex, 
        uint price) 
    {

        if ((isOwner(_index) || !isPrivate(_index))) {
            Combo storage combo = comboHub[_index];
            address owner = comboOwner[_index];
            return (
                combo.id, 
                combo.name, 
                combo.description, 
                owner, 
                combo.tokenAddresses, 
                combo.weights, 
                combo.isPrivate, 
                0);
        } else {
            //TODO
            revert();
            // address[] memory tokenAddresses;
            // uint[] memory weights;
            // string memory name;
            // string memory description;
            // return (0, name,description, tokenAddresses[0], tokenAddresses, weights, false, 0);
        }
    }

    function getStrategies() public {
        //TODO
    }

    function _checkCombo(address[] _tokenAddresses, uint[] _weights) internal pure returns(bool) {
        require(_tokenAddresses.length == _weights.length);
        uint total = 0;
        for (uint i = 0; i < _weights.length; ++i) {
            total += _weights[i];
        }
        return total == 100;
    }

}
