pragma solidity ^0.4.21;
//pragma experimental ABIEncoderV2;
/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
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

contract PriceProvider is Provider, Ownable,Publish {
    
    bytes32[] _tokenAddress_exchange_senders;
    uint[] _price;
    uint _nonce;
    
    mapping(bytes32 => uint) public priceList;
    
    event PriceUpdate(uint _nonce, bytes32 _tokenAddress,uint pirce);

    //function getSupportedTokens() external returns (address[] tokenAddresses);
    //function getPrices(address[] tokenAddresses) external returns (uint[] prices);
    //function getPrice(address tokenAddress) external returns (uint);


    //Update_price
    function updatePrices(bytes32[] _tokenAddressExchangeSenders,uint[] _Price,uint _Nonce) external returns (bool success) {
        require(_nonce<_Nonce);
        require(_tokenAddressExchangeSenders.length == _Price.length);
        _nonce = _Nonce;
        for (var i = 0; i < _tokenAddressExchangeSenders.length; i++) {
            priceList[_tokenAddressExchangeSenders[i]] = _Price[i];
            PriceUpdate( _Nonce,_tokenAddressExchangeSenders[i] ,_Price[i]);
        }
        return true;
    }
    function PriceProvider (uint _number) public {
      _nonce = _number;
    }
    //function getPrices(address[] tokenAddresses) external returns (uint[] prices);
    function getPrice(bytes32 _tokenAddressExchangeSender) public constant returns(uint _result){
        return(priceList[_tokenAddressExchangeSender]);
    }
    function getNonce() public constant returns(uint nonce){
        return _nonce;
    }   
    
}
