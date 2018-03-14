pragma solidity ^0.4.18;

import '../libs/Ownable.sol';
import '../libs/Provider.sol';

contract StrategyProvider is Provider, Ownable {
//    event StrategyChanged(string strategyId);
//
//    // To core smart contract
//    function getStrategies() external returns (uint[] ids, string[] names, string[] descriptions);
//    function getStrategy(string strategyId) external returns (string name, address owner, string description, address[] tokens, uint[] weights);
//
//    // To clients
//    function createStrategy(string name, string description, address[] tokenAddresses, uint[] weights, bool isPrivate, uint priceInMot) public returns (uint strategyId);
//    function updateStrategy(uint strategyId, string description, address[] tokenAddresses, uint[] weights, bool isPrivate, uint priceInMot) public returns (bool success);

    struct Combo {
        uint id;
        string name;
        string description;
        bool isPrivate;      // false --> public/ true --> private
        address[] tokenAddresses;
        uint[] weights;      //total is 100
    }

    Combo[] ComboHub;

    mapping(address => uint[]) ComboIndex;

    mapping(uint => address) ComboOwner;

    event comboCreate(Combo _combo);

    event comboUpdate(Combo _combo);


    modifier _checkIndex(uint _index) {
        require(_index < ComboHub.length);
        _;
    }

    function StrategyProvider() {}

    function _checkCombo(address[] _tokenAddresses, uint[] _weights) internal pure returns(bool) {
        require(_tokenAddresses.length == _weights.length);


            uint total = 0;
            for (uint i = 0; i < _weights.length; ++i) {
                total += _weights[i];
            }
            return total == 100;

    }


    function createStrategy(
        string _name,
        string _description,
        address[] _tokenAddresses,
        uint[] _weights,
        bool _isPrivate,
        uint priceInMot
    ) public returns(uint) {

        address owner = msg.sender;

        require(_checkCombo(_tokenAddresses, _weights));

        uint comboId = ComboIndex[msg.sender].length;
        Combo memory myCombo = Combo(comboId, _name, _description, _isPrivate, _tokenAddresses, _weights);

        combo(myCombo);

        uint index = ComboHub.push(myCombo) - 1;

        ComboOwner[index] = owner;
        ComboIndex[owner].push(index);

        return index;
    }

    function updateStrategy(uint _index, string _name, string _description, bool _isPrivate, address[] _tokenAddresses, uint[] _weights, uint _priceInMot) returns (bool success) {

        //if (!_checkCombo(_tokenAddresses, _weights) || !isOwner(_index)) {
            require(_checkCombo(_tokenAddresses, _weights);
            require(isOwner(_index));
            
            ComboHub[_index].name = _name;
            ComboHub[_index].description = _description;
            ComboHub[_index].isPrivate = _isPrivate;
            ComboHub[_index].tokenAddresses = _tokenAddresses;
            ComboHub[_index].weights = _weights;
            
            comboUpdate(ComboHub[_index]);
            return true;
            }


    function isPrivate(uint _index) _checkIndex(_index) view returns(bool) {
        return ComboHub[_index].isPrivate;
    }

    function isOwner(uint _index) _checkIndex(_index) view returns(bool) {
        return ComboOwner[_index] == msg.sender;
    }

    function getAllStrategyIndex() view returns (uint[]) {
        return ComboIndex[msg.sender];
    }

    function getStrategy(uint _index) _checkIndex(_index) view returns (uint, string, string, address, address[], uint[], bool, uint) {

        if ((isOwner(_index) || !isPrivate(_index))) {
            Combo combo = ComboHub[_index];
            address owner = ComboOwner[_index];
            return (combo.id, combo.name, combo.description, owner, combo.tokenAddresses, combo.weights, combo.isPrivate, 0);
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

    function getStrategies() {
        //TODO
    }

}
