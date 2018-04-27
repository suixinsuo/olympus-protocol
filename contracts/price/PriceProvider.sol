pragma solidity ^0.4.22;

//这个合约控制数据库

// import "../libs/Ownable.sol";
import "../libs/SafeMath.sol";
import "../libs/itMaps.sol";
import "../permission/PermissionProviderInterface.sol";
import { TypeDefinitions as TD } from "../libs/Provider.sol";

// 正式合约
// 思路是：
// Library存放(
//     hash(provider_address,TokenAddress,ExchangeHash),price;
//   )

contract DecentralizationExchanges {
    //Kyber
    function getExpectedRate(address src, address dest, uint srcQty) external view returns (uint expectedRate, uint slippageRate);
}



contract PriceProviderInterface {

    function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);

    function getNewDefaultPrice(address _tokenAddress) public view returns(uint);

    function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);

    function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);

    function checkTokenSupported(address tokenAddress)  public view returns(bool success);

    function checkExchangeSupported(bytes32 Exchanges)  public view returns(bool success);

    function checkProviderSupported(address providerAddress,address tokenAddress)  public view returns(bool success);

}

contract PriceProvider {

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

    //Kyber address
    address eth_token = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    //address kyber = 0x65b1faad1b4d331fd0ea2a50d5be2c20abe42e50;
    DecentralizationExchanges _kyber ;

    //实时价格记录
    //(Provider => (Token => Price))
    mapping(address =>mapping(address=>uint)) internal Price;



    //日志记录

    event UpdatePrice(address _tokenAddress,bytes32 _exchange,uint price);

    event ExchangeUpdate(bytes32[] oldExchanges,bytes32[] newExchanges);

    event TokenUpdate(address[] oldToken,address[] newToken);

    //Token_address,oldProvider,newProvider
    event ProviderUpdate(address Tokenaddress,address[] oldProviders,address[] newProviders);

    event DefaultProviderUpdate(address _tokenaddress,address OldDefaultProvider,address NewDefaultProvider);

    event _GetPrice(address _provider,address token,uint price);

    event ChangeWeight(bytes32 exchnage,uint weight);

    event SetKyber(address _KYBER);


  //初始化数据库
    itMaps.itMapBytes32Uint priceData;

    PermissionProviderInterface internal permissionProvider;

    modifier onlyOwner() {
        require(permissionProvider.has(msg.sender, TD.ROLE_PRICE_OWNER));
        _;
    }

    function PriceProvider (address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    function setKyber(address kyber) public onlyOwner() returns(bool success){
        require(kyber != address(0));
        _kyber = DecentralizationExchanges(kyber);
        emit SetKyber(kyber);
    }

    function () public payable {
        revert();
    }

    function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success){
        require(ProviderList[_tokenAddress][msg.sender]);
        require(TokenList[_tokenAddress]);
        require(Nonce[msg.sender][_tokenAddress] == _nonce);
        require(_exchanges.length == _prices.length&&_prices.length == _EXCHANGE.length);

        for(uint i = 0; i < _exchanges.length; i++){
            require(ExchangeList[_exchanges[i]]);
            bytes32 _data = keccak256(msg.sender,_tokenAddress,_exchanges[i]);
            priceData.insert(_data, _prices[i]);
            emit UpdatePrice(_tokenAddress,_exchanges[i],_prices[i]);
        }

        Price[msg.sender][_tokenAddress] = NewPriceWeight(msg.sender,_tokenAddress,_exchanges,_prices);

        Nonce[msg.sender][_tokenAddress] = _nonce + 1;


        return true;
    }

    // function getDefaultPrice(address _tokenAddress) public returns(uint){
    //     //定义函数内部变长数组
    //     uint length = _EXCHANGE.length;
    //     uint[] memory _priceNow = new uint[](length);

    //     for (uint i = 0 ; i < _EXCHANGE.length ; i ++ ){
    //         //priceData.getValueByIndex(k);
    //         bytes32 _data = keccak256(_Provider[_tokenAddress][0],_tokenAddress,_EXCHANGE[i]);
    //         _priceNow[i] = (priceData.get(_data));
    //     }

    //     uint _price = PriceWeight(_priceNow);

    //     emit _GetPrice(_Provider[_tokenAddress][0],_tokenAddress,_price);

    //     return _price;

    // }

    // function getCustomPrice(address _provider,address _tokenAddress) public returns(uint){
    //     //定义函数内部变长数组
    //     uint[] memory _priceNow = new uint[](_EXCHANGE.length);

    //     for (uint i = 0 ; i < _EXCHANGE.length; i ++){

    //         bytes32 _data = keccak256(_provider, _tokenAddress,_EXCHANGE[i]);
    //         _priceNow[i] = (priceData.get(_data));

    //     }

    //     uint _price = PriceWeight(_priceNow);

    //     emit _GetPrice(_provider,_tokenAddress,_price);

    //     return _price;
    // }

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
        for (uint i = 0; i < _EXCHANGE.length; i ++){
            ExchangeList[_EXCHANGE[i]] = false;
        }

        for ( i = 0; i < _newExchanges.length; i ++){
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
        for (uint i = 0; i < _TOKEN.length; i ++){
            TokenList[_TOKEN[i]] = false;
        }

        for ( i = 0; i < _newTokens.length; i ++){
            TokenList[_newTokens[i]] = true;
        }
        emit TokenUpdate(_TOKEN,_newTokens);
        _TOKEN = _newTokens;

        //是否清除数据 待测试
        //priceData.destroy();

        return true;
    }
    function changeProviders(address[] _newProviders,address _tokenAddress) public onlyOwner returns(bool success) {

        for (uint i = 0; i < _Provider[_tokenAddress].length; i ++){
            ProviderList[_tokenAddress][_Provider[_tokenAddress][i]] = false;
             //清空Nonce
            Nonce[_tokenAddress][_Provider[_tokenAddress][i]] = 0;
        }

        for ( i = 0; i < _newProviders.length; i ++){
            ProviderList[_tokenAddress][_newProviders[i]] = true;
        }
        emit ProviderUpdate(_tokenAddress,_Provider[_tokenAddress],_newProviders);
        _Provider[_tokenAddress] = _newProviders;


        //是否清除数据 待测试
        //priceData.destroy();

        return true;
    }

    //kyber
    function getrates(address dest, uint srcQty)  public view returns (uint expectedRate,uint slippageRate){
        //require(dest != 0x0);
        (expectedRate,slippageRate ) = _kyber.getExpectedRate(eth_token, dest , srcQty);
        return(expectedRate,slippageRate);
    }

    //修改默认Provider

    function changeDefaultProviders(address _newProvider,address _tokenAddress) public onlyOwner returns(bool success) {
        emit DefaultProviderUpdate(_tokenAddress,_Provider[_tokenAddress][0],_newProvider);
        _Provider[_tokenAddress][0] = _newProvider;
        return true;
    }

    //内部处理权重函数
    function PriceWeight(uint[] _prices) internal returns(uint _price){
        //Weight权重处理
        return _prices[0];
    }

    function NewPriceWeight(address _providerAddress, address _tokenAddress, bytes32[] _Exchange,uint[] _prices) internal returns(uint _price){
        //Weight权重处理
        return _prices[0];
    }

    function changeWeight(bytes32[] _exchanges,uint[] _newWeights) onlyOwner public returns(bool success) {

        for(uint i = 0; i<_exchanges.length; i++){

            Weight[_exchanges[i]] = _newWeights[i];

            emit ChangeWeight(_exchanges[i],_newWeights[i]);


        }

        return true;
    }

    function GetNonce(address providerAddress,address tokenAddress) public view returns(uint){
        return Nonce[providerAddress][tokenAddress];
    }

    function checkTokenSupported(address tokenAddress) view public returns(bool success){
        return TokenList[tokenAddress];
    }

    function checkExchangeSupported(bytes32 Exchanges) view public returns(bool success){
        return ExchangeList[Exchanges];
    }
    function checkProviderSupported(address providerAddress,address tokenAddress) view public returns(bool success){
        return ProviderList[tokenAddress][providerAddress];
    }
}


// TODO
// 支持不同Token不同交易所和权重处理
// 支持自定义权重



// TODO
// 支持Nonce 分token处理
