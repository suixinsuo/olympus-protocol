pragma solidity ^0.4.22;

import "../libs/SafeMath.sol";
import "../libs/itMaps.sol";
import "../permission/PermissionProviderInterface.sol";
import "./PriceProviderInterface.sol";
import { TypeDefinitions as TD } from "../libs/Provider.sol";

contract DecentralizationExchanges {
    function getExpectedRate(address src, address dest, uint srcQty) external view returns (uint expectedRate, uint slippageRate);
}

contract PriceProvider {
    using SafeMath for uint256;

    using itMaps for itMaps.itMapBytes32Uint;
    mapping(bytes32 => bool) internal ExchangeList;
    mapping(address => mapping(address => bool)) internal ProviderList;
    mapping(address => bool) internal TokenList;
    mapping(address => mapping(address => uint)) internal Nonce;
    mapping(bytes32 => uint) internal Weight;

    bytes32[] internal _EXCHANGE;
    address[] internal _TOKEN;
    mapping(address =>address[]) internal _Provider;

    address constant eth_token = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    DecentralizationExchanges _kyber ;
    mapping(address =>mapping(address=>uint)) internal Price;

    // events
    event UpdatePrice(address _tokenAddress,bytes32 _exchange,uint price);
    event ExchangeUpdate(bytes32[] oldExchanges,bytes32[] newExchanges);
    event TokenUpdate(address[] oldToken,address[] newToken);
    event ProviderUpdate(address Tokenaddress,address[] oldProviders,address[] newProviders);
    event DefaultProviderUpdate(address _tokenaddress,address OldDefaultProvider,address NewDefaultProvider);
    event _GetPrice(address _provider,address token,uint price);
    event ChangeWeight(bytes32 exchnage,uint weight);
    event SetKyber(address _KYBER);

    itMaps.itMapBytes32Uint priceData;

    modifier onlyOwner() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_PRICE_OWNER()));
        _;
    }

    PermissionProviderInterface internal permissionProvider;

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
        require(_exchanges.length == _prices.length && _prices.length == _EXCHANGE.length);

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

    function getNewDefaultPrice(address _tokenAddress) public view returns(uint){
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

        //priceData.destroy();
        return true;
    }

    function changeTokens(address[] _newTokens) public onlyOwner returns(bool success) {
        for (uint i = 0; i < _TOKEN.length; i ++){
            TokenList[_TOKEN[i]] = false;
        }

        for ( i = 0; i < _newTokens.length; i ++){
            TokenList[_newTokens[i]] = true;
        }
        emit TokenUpdate(_TOKEN,_newTokens);
        _TOKEN = _newTokens;

        //priceData.destroy();

        return true;
    }

    function changeProviders(address[] _newProviders,address _tokenAddress) public onlyOwner returns(bool success) {
        for (uint i = 0; i < _Provider[_tokenAddress].length; i ++){
            ProviderList[_tokenAddress][_Provider[_tokenAddress][i]] = false;
            Nonce[_tokenAddress][_Provider[_tokenAddress][i]] = 0;
        }

        for ( i = 0; i < _newProviders.length; i ++){
            ProviderList[_tokenAddress][_newProviders[i]] = true;
        }
        emit ProviderUpdate(_tokenAddress,_Provider[_tokenAddress],_newProviders);
        _Provider[_tokenAddress] = _newProviders;

        // priceData.destroy();

        return true;
    }

    function getRates(address dest, uint srcQty) public view returns (uint expectedRate,uint slippageRate){
        (expectedRate,slippageRate ) = _kyber.getExpectedRate(eth_token, dest, srcQty);
        return(expectedRate,slippageRate);
    }

    function getSellRates(address _src, uint _srcQty) public view returns (uint expectedRate, uint slippageRate){
        (expectedRate,slippageRate ) = _kyber.getExpectedRate(_src, eth_token, _srcQty);
        return(expectedRate,slippageRate);
    }

    function changeDefaultProviders(address _newProvider,address _tokenAddress) public onlyOwner returns(bool success) {
        emit DefaultProviderUpdate(_tokenAddress,_Provider[_tokenAddress][0],_newProvider);
        _Provider[_tokenAddress][0] = _newProvider;
        return true;
    }

    function PriceWeight(uint[] _prices) internal returns(uint _price){
        return _prices[0];
    }

    function NewPriceWeight(address _providerAddress, address _tokenAddress, bytes32[] _Exchange,uint[] _prices) internal returns(uint _price){
        return _prices[0];
    }

    function changeWeight(bytes32[] _exchanges,uint[] _newWeights) onlyOwner public returns(bool success) {
        for(uint i = 0; i<_exchanges.length; i++){
            Weight[_exchanges[i]] = _newWeights[i];
            emit ChangeWeight(_exchanges[i],_newWeights[i]);
        }

        return true;
    }

    function getNonce(address providerAddress,address tokenAddress) public view returns(uint){
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
