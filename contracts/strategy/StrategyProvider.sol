pragma solidity ^0.4.18;

// import "./StrategyProviderInterface.sol";
// import "../libs/Converter.sol";

// contract StrategyProvider is StrategyProviderInterface {
//     event StrategyChanged(uint strategyId);

//     mapping(address => uint[]) public comboIndex;
//     mapping(uint => address) public comboOwner;

//     event ComboCreated(uint id, string name);
//     event ComboUpdated(uint id, string name);

//     function createStrategy(
//         string _name,
//         string _description,
//         string _category,
//         address[] _tokenAddresses,
//         uint[] _weights
//         // bool _isPrivate
//         )
//         public returns(uint)
//     {

//         address owner = msg.sender;
//         require(_checkCombo(_tokenAddresses, _weights));
//         uint comboId = comboIndex[msg.sender].length;
//         Combo memory myCombo = Combo(comboId, _name, _description, _category, /*_isPrivate,*/ _tokenAddresses, _weights, 0, 0);

//         ComboCreated(myCombo.id, myCombo.name);

//         uint index = comboHub.push(myCombo) - 1;

//         comboOwner[index] = owner;
//         comboIndex[owner].push(index);

//         return index;
//     }

//     function updateStrategy(
//         uint _index,
//         string _name,
//         string _description,
//         string _category,
//         // bool _isPrivate,
//         address[] _tokenAddresses,
//         uint[] _weights)
//         public returns (bool success)
//     {

//         require(_checkCombo(_tokenAddresses, _weights));
//         require(isOwner(_index));

//         comboHub[_index].name = _name;
//         comboHub[_index].description = _description;
//         comboHub[_index].category = _category;
//         // comboHub[_index].isPrivate = _isPrivate;
//         comboHub[_index].tokenAddresses = _tokenAddresses;
//         comboHub[_index].weights = _weights;

//         ComboUpdated(comboHub[_index].id, comboHub[_index].name);
//         return true;
//     }

//     // function isPrivate(uint _index) public _checkIndex(_index) view returns(bool) {
//     //     return comboHub[_index].isPrivate;
//     // }

//     function isOwner(uint _index) public _checkIndex(_index)  view returns(bool) {
//         return comboOwner[_index] == msg.sender;
//     }

//     function getMyStrategies() public view returns (uint[]) {
//         return comboIndex[msg.sender];
//     }

//     function getStrategies(address _owner) public view returns (uint[]) {
//         return comboIndex[_owner];
//     }

//     function getStrategy(uint _index) public _checkIndex(_index) view returns (
//         uint id,
//         bytes32 name,
//         bytes32 description,
//         bytes32 category,
//         address indexOwner,
//         // address[] tokenAddresses,
//         // uint[] weights,
//         uint follower,
//         uint amount)
//     {

//         if ((isOwner(_index)/* || !isPrivate(_index)*/)) {
//             Combo storage combo = comboHub[_index];
//             address owner = comboOwner[_index];
//             return (
//                 combo.id,
//                 Converter.stringToBytes32(combo.name),
//                 Converter.stringToBytes32(combo.description),
//                 Converter.stringToBytes32(combo.category),
//                 owner,
//                 // combo.tokenAddresses,
//                 // combo.weights,
//                 combo.follower,
//                 combo.amount);
//         } else {
//             //TODO
//             revert();
//             // address[] memory tokenAddresses;
//             // uint[] memory weights;
//             // string memory name;
//             // string memory description;
//             // return (0, name,description, tokenAddresses[0], tokenAddresses, weights, false, 0);
//         }
//     }
//     //TODO require core contract address
//     function incrementStatistics(uint _index, uint _amountInEther) external returns (bool){
//         comboHub[_index].amount += _amountInEther;
//     }

//     function _checkCombo(address[] _tokenAddresses, uint[] _weights) internal pure returns(bool) {
//         require(_tokenAddresses.length == _weights.length);
//         uint total = 0;
//         for (uint i = 0; i < _weights.length; ++i) {
//             total += _weights[i];
//         }
//         return total == 100;
//     }


// }
