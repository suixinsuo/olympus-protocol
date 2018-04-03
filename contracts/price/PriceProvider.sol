pragma solidity ^0.4.19;

//这个合约控制数据库

library itMaps {

    struct entryBytes32Uint {
        // Equal to the index of the key of this item in keys, plus 1.
        uint keyIndex;
        uint value;
    }

    struct itMapBytes32Uint {
        mapping(bytes32 => entryBytes32Uint) data;
        bytes32[] keys;
    }

    function insert(itMapBytes32Uint storage self, bytes32 key, uint value) internal returns (bool replaced) {
        entryBytes32Uint storage e = self.data[key];
        e.value = value;
        if (e.keyIndex > 0) {
            return true;
        } else {
            e.keyIndex = ++self.keys.length;
            self.keys[e.keyIndex - 1] = key;
            return false;
        }
    }

    function remove(itMapBytes32Uint storage self, bytes32 key) internal returns (bool success) {
        entryBytes32Uint storage e = self.data[key];
        if (e.keyIndex == 0)
            return false;

        if (e.keyIndex <= self.keys.length) {
            // Move an existing element into the vacated key slot.
            self.data[self.keys[self.keys.length - 1]].keyIndex = e.keyIndex;
            self.keys[e.keyIndex - 1] = self.keys[self.keys.length - 1];
            self.keys.length -= 1;
            delete self.data[key];
            return true;
        }
    }

    function destroy(itMapBytes32Uint storage self) internal  {
        for (uint i; i<self.keys.length; i++) {
          delete self.data[ self.keys[i]];
        }
        delete self.keys;
        return ;
    }

    function contains(itMapBytes32Uint storage self, bytes32 key) internal constant returns (bool exists) {
        return self.data[key].keyIndex > 0;
    }

    function size(itMapBytes32Uint storage self) internal constant returns (uint) {
        return self.keys.length;
    }

    function get(itMapBytes32Uint storage self, bytes32 key) internal constant returns (uint) {
        return self.data[key].value;
    }

    function getKey(itMapBytes32Uint storage self, uint idx) internal constant returns (bytes32) {
      /* Decrepated, use getKeyByIndex. This kept for backward compatilibity */
        return self.keys[idx];
    }

    function getKeyByIndex(itMapBytes32Uint storage self, uint idx) internal constant returns (bytes32) {
      /* Same as decrepated getKey. getKeyByIndex was introduced to be less ambiguous  */
        return self.keys[idx];
    }

    function getValueByIndex(itMapBytes32Uint storage self, uint idx) internal constant returns (uint) {
        return self.data[self.keys[idx]].value;
    }
}

library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
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
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }
}

// 正式合约
// 思路是：
// Library存放(
//     hash(provider_address,TokenAddress,ExchangeHash),price;
//   )

contract PriceOracleInterface {

  function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);

  function getNewDefaultPrice(address _tokenAddress) public view returns(uint);

  function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);

  function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);

//   function getExchangeLength() view returns(uint);

//   function getTokenLength() view returns(uint);

//   function getProviderLength(address _tokenAddress) view returns(uint);

//   function getExhchange(uint number) view returns(bytes32);

//   function getProvider(uint number,address _tokenAddress) view returns(address);

//   function getToken(uint number) view returns(address);

     function checkTokenSupported(address tokenAddress) public view returns(bool success);
     function checkExchangeSupported(bytes32 Exchanges) public view returns(bool success);
     function checkProviderSupported(address providerAddress,address tokenAddress) public view returns(bool success);

}

contract PriceOracle is Ownable {

  //防止计算下坠攻击
  //using math for SafeMath;

  //标准数据库
  using itMaps for itMaps.itMapBytes32Uint;

  //规定Provider[_tokenAddress][0] 为默认provider


  //mapping(address =>address) public defaultProvider;

  //允许的交易所list
  mapping(bytes32 => bool) internal ExchangeList;

  //允许的Providerlist
  //Tokenaddress => (Provider => bool)
  mapping(address => mapping(address => bool)) internal ProviderList;

  //允许的Tokenlist
  mapping(address => bool) internal TokenList;

  //单独计算每个账户的Token的Nonce

  mapping(address => mapping(address => uint)) internal Nonce;

  mapping(bytes32 => uint) internal Weight;

  //交易所.Token.Provider 本地记录
  bytes32[] internal _EXCHANGE;
  address[] internal _TOKEN;
  //token address
  mapping(address =>address[]) internal _Provider;




  //实时价格记录
   //(Provider => (Token => Price))
   mapping(address =>mapping(address=>uint)) internal Price;



  //日志记录

  event UpdatePrice(address _tokenAddress,bytes32 _exchange,uint price);

  event ExchangeUpdate(bytes32[],bytes32[]);

  event TokenUpdate(address[],address[]);

  //Token_address,oldProvider,newProvider
  event ProviderUpdate(address Tokenaddress,address[] oldProviders,address[] newProviders);

  event DefaultProviderUpdate(address _tokenaddress,address OldDefaultProvider,address NewDefaultProvider);

  event _GetPrice(address _provider,address token,uint price);

  event ChangeWeight(bytes32,uint);


  //初始化数据库
  itMaps.itMapBytes32Uint priceData;

    function () public payable {
		revert();
	}

  function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success){
      require(ProviderList[_tokenAddress][msg.sender]);
      require(TokenList[_tokenAddress]);
      require(Nonce[msg.sender][_tokenAddress] == _nonce);
      require(_exchanges.length == _prices.length&&_prices.length == _EXCHANGE.length);

      for(uint i =0; i < _exchanges.length; i++){
          require(ExchangeList[_exchanges[i]]);
          bytes32 _data = keccak256(msg.sender,_tokenAddress,_exchanges[i]);
          priceData.insert( _data, _prices[i]);
          emit UpdatePrice(_tokenAddress,_exchanges[i],_prices[i]);
      }

      Price[msg.sender][_tokenAddress] = NewPriceWeight(msg.sender,_tokenAddress,_exchanges,_prices);

      Nonce[msg.sender][_tokenAddress] = _nonce + 1;


      return true;
  }

    function getDefaultPrice(address _tokenAddress) public returns(uint){
        //定义函数内部变长数组
        uint length = _EXCHANGE.length;
        uint[] memory _priceNow = new uint[](length);

        for (uint i =0; i < _EXCHANGE.length; i ++){
            //priceData.getValueByIndex(k);
            bytes32 _data = keccak256(_Provider[_tokenAddress][0],_tokenAddress,_EXCHANGE[i]);
            _priceNow[i] = (priceData.get(_data));
        }

        uint _price = PriceWeight(_priceNow);

        emit _GetPrice(_Provider[_tokenAddress][0],_tokenAddress,_price);

        return _price;

    }

    function getCustomPrice(address _provider,address _tokenAddress) public returns(uint){
        //定义函数内部变长数组
        uint[] memory _priceNow = new uint[](_EXCHANGE.length);

        for (uint i =0; i < _EXCHANGE.length; i ++){

            bytes32 _data = keccak256(_provider, _tokenAddress,_EXCHANGE[i]);
            _priceNow[i] = (priceData.get(_data));

        }

        uint _price = PriceWeight(_priceNow);

        emit _GetPrice(_provider,_tokenAddress,_price);

        return _price;
    }

    //新接口

    function getNewDefaultPrice(address _tokenAddress) public view returns(uint){
        //规定Provider[_tokenAddress][0] 为默认provider
        uint _defaultprice = Price[_Provider[_tokenAddress][0]][_tokenAddress];

        emit _GetPrice(_Provider[_tokenAddress][0],_tokenAddress, _defaultprice);
        return _defaultprice;


    }
    function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint){

        uint _customprice = Price[_provider][_tokenAddress];

        emit _GetPrice(_provider,_tokenAddress, _customprice);
        return _customprice;

    }

    function changeExchanges(bytes32[] _newExchanges) public onlyOwner returns(bool success) {
        for (uint i =0; i < _EXCHANGE.length; i ++){
            ExchangeList[_EXCHANGE[i]] = false;
        }

        for ( i =0; i < _newExchanges.length; i ++){
            ExchangeList[_newExchanges[i]] = true;
        }
        emit ExchangeUpdate(_EXCHANGE,_newExchanges);
        _EXCHANGE = _newExchanges;

        //是否清除数据 待测试
        //priceData.destroy();

        return true;
    }
    //TODO
    function changeTokens(address[] _newTokens) public onlyOwner returns(bool success) {
        for (uint i =0; i < _TOKEN.length; i ++){
            TokenList[_TOKEN[i]] = false;
        }

        for ( i =0; i < _newTokens.length; i ++){
            TokenList[_newTokens[i]] = true;
        }
        emit TokenUpdate(_TOKEN,_newTokens);
        _TOKEN = _newTokens;

        //是否清除数据 待测试
        //priceData.destroy();

        return true;
    }
    function changeProviders(address[] _newProviders,address _tokenAddress) public onlyOwner returns(bool success) {

        for (uint i =0; i < _Provider[_tokenAddress].length; i ++){
             ProviderList[_tokenAddress][_Provider[_tokenAddress][i]] = false;
             //清空Nonce
             Nonce[_tokenAddress][_Provider[_tokenAddress][i]] = 0;
         }

         for ( i =0; i < _newProviders.length; i ++){
             ProviderList[_tokenAddress][_newProviders[i]] = true;
         }
         emit ProviderUpdate(_tokenAddress,_Provider[_tokenAddress],_newProviders);
         _Provider[_tokenAddress] = _newProviders;


        //是否清除数据 待测试
        //priceData.destroy();

        return true;
    }
    //修改默认Provider

    function changeDefaultProviders(address _newProvider,address _tokenAddress) public onlyOwner returns(bool success) {
        _Provider[_tokenAddress][0] = _newProvider;
        return true;
    }

    //内部处理权重函数
    function PriceWeight(uint[] _prices) internal returns(uint _price){
        //Weight权重处理
        return _prices[0];
    }

    function NewPriceWeight(address _providerAddress,address _tokenAddress,bytes32[] _Exchange,uint[] _prices) internal returns(uint _price){
        //Weight权重处理
        return _prices[0];
    }

    function changeWeight(bytes32[] _exchanges,uint[] _newWeights) public onlyOwner returns(bool success) {

        for(uint i = 0; i<_exchanges.length; i++){

            Weight[_exchanges[i]] = _newWeights[i];

            emit ChangeWeight(_exchanges[i],_newWeights[i]);


        }

        return true;
    }

    function GetNonce(address providerAddress,address tokenAddress) public view returns(uint){
        return Nonce[providerAddress][tokenAddress];
    }
    //获取数据
    // function getExchangeLength() view returns(uint){
    //      return _EXCHANGE.length;
    // }
    //  function getTokenLength() view returns(uint){
    //      return _TOKEN.length;
    // }
    //  function getProviderLength(address _tokenAddress) view returns(uint){
    //      return _Provider[_tokenAddress].length;
    // }

    // function getExhchange(uint number) view returns(bytes32) {
    //     return _EXCHANGE[number];
    // }
    // function getProvider(uint number,address _tokenAddress) view returns(address) {
    //     return _Provider[_tokenAddress][number];
    // }
    // function getToken(uint number) view returns(address) {
    //     return _TOKEN[number];
    // }

    function checkTokenSupported(address tokenAddress) public view returns(bool success){
        return TokenList[tokenAddress];
    }

    function checkExchangeSupported(bytes32 Exchanges) public view returns(bool success){
        return ExchangeList[Exchanges];
    }
    function checkProviderSupported(address providerAddress,address tokenAddress) public view returns(bool success){
        return ProviderList[tokenAddress][providerAddress];
    }
}


// TODO
// 支持不同Token不同交易所和权重处理
// 支持自定义权重



// TODO
// 支持Nonce 分token处理
