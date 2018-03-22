pragma solidity ^0.4.21;
//pragma experimental ABIEncoderV2;
/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
library IterableMapping
{
  struct itmap
  {
    mapping(bytes32 => IndexValue) data;
    KeyFlag[] keys;
    uint size;
  }
  struct IndexValue { uint keyIndex; uint value; }
  struct KeyFlag { bytes32 key; bool deleted; }
  function insert(itmap storage self, bytes32 key, uint value) returns (bool replaced)
  {
    uint keyIndex = self.data[key].keyIndex;
    self.data[key].value = value;
    if (keyIndex > 0)
      return true;
    else
    {
      keyIndex = self.keys.length++;
      self.data[key].keyIndex = keyIndex + 1;
      self.keys[keyIndex].key = key;
      self.size++;
      return false;
    }
  }
  function remove(itmap storage self, bytes32 key) returns (bool success)
  {
    uint keyIndex = self.data[key].keyIndex;
    if (keyIndex == 0)
      return false;
    delete self.data[key];
    self.keys[keyIndex - 1].deleted = true;
    self.size --;
  }
  function contains(itmap storage self, bytes32 key) returns (bool)
  {
    return self.data[key].keyIndex > 0;
  }
  function iterate_start(itmap storage self) returns (uint keyIndex)
  {
    return iterate_next(self, uint(-1));
  }
  function iterate_valid(itmap storage self, uint keyIndex) returns (bool)
  {
    return keyIndex < self.keys.length;
  }
  function iterate_next(itmap storage self, uint keyIndex) returns (uint r_keyIndex)
  {
    keyIndex++;
    while (keyIndex < self.keys.length && self.keys[keyIndex].deleted)
      keyIndex++;
    return keyIndex;
  }
  function iterate_get(itmap storage self, uint keyIndex) returns (bytes32 key, uint value)
  {
    key = self.keys[keyIndex].key;
    value = self.data[key].value;
  }
}

contract PriceWeightInterface{
    function getPrice(address tokenaddress, bytes32[] _Exchanges,  uint[] _prices) public returns(uint price);
} 

contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

contract Publish is Ownable{
  address[] public publisher;

    modifier onlyPublisher() {
    require(checkPublisher(msg.sender));
    _;
  }

  function publish() public {
    publisher.push(owner);
  }

  function addPublisher(address _publisher) public onlyOwner {
    for (uint i = 0; i < publisher.length; i ++) {
      if (publisher[i] == _publisher) {
        return;
      }
    }
    publisher.push(_publisher);
  }

  function removePublisher(address _publisher) public onlyOwner {
    uint i = 0;
    for (; i < publisher.length; i ++) {
      if (publisher[i] == _publisher) {
        break;
      }
    }

    if (i > publisher.length - 1) {
      //not found
      return;
    } else {
      publisher[i] = publisher[publisher.length - 1];
      publisher.length = publisher.length - 1;
      return;
    }
  }
  function checkPublisher(address _publisher) returns(bool success){
      return true;
  }
}


contract Provider {
  enum ProvderType{
      Strategy,
      Pricing,
      Exchange
  }
      
  struct ProviderStatistic {
      uint counter;
  }    

  struct ERC20Token {
      string symbol;
      address tokenAddress;
      uint decimal;
  }    

  string public name;
  ProvderType public providerType;
  string public description;
  mapping(string => bool) internal properties;
  ProviderStatistic public statistics;
}

contract PriceProvider is Provider, Ownable, Publish {

    address _ploy = 0x22260D1f2cB61a371BFF2625c4620Fc5A67f0A8e;
    uint public nonce;
    IterableMapping.itmap priceData;
    
    PriceWeightInterface  _priceweightinterface = PriceWeightInterface(_ploy);
    mapping(address => mapping(bytes32 => uint)) tokenPrice;

    event PriceUpdated(uint _nonce, address tokenAddress, bytes32 _exchanges,uint _price);

    function PriceProvider (uint _number) public {
        nonce = _number;
    }       

    //Data
    function updatePrices(address tokenAddresses, bytes32[] _Exchanges,  uint[] _prices, uint _nonce) external returns (bool success){
        require(nonce == _nonce);
        require(_Exchanges.length == _prices.length);
        nonce = _nonce + 1;
        for (var index = 0; index < _Exchanges.length; index++) {
            tokenPrice[tokenAddresses][_Exchanges[index]] = _prices[index];
            PriceUpdated(_nonce, tokenAddresses, _Exchanges[index], _prices[index]);
        }
        return true;
    }

    function getPrice(address tokenAddresses) external returns (uint prices){
        bytes32[] _Exchanges;
        uint[] _Prices;
        //function getPrice(address tokenaddress, bytes32[] _Exchanges,  uint[] _prices) public returns(uint price);
        //for(var i = 0;i < tokenPrice[tokenAddresses][0].length;i++ ){
        //    _Exchanges.push();
        //    _Prices.push();
        //}
        //for ( bytes32 keys in tokenPrice[tokenAddresses]){
            
        //}
        //prices = _priceweightinterface.getPrice(tokenAddresses,_Exchanges,_Prices);
        
    }
    

    function getNonce() public constant returns(uint) {
        return nonce;
    }  
}
