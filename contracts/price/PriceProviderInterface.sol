pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract PriceProviderInterface is Provider {
    // For now, all price are ETH based.
    event PriceUpdated(uint timeUpdated);

    function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);

    function getNewDefaultPrice(address _tokenAddress) public view returns(uint);

    function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);

    function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);

    function getExchangeLength() public view returns(uint);

    function getTokenLength()  public view returns(uint);

    function getProviderLength(address _tokenAddress)  public view returns(uint);

    function checkTokenSupported(address _tokenAddrss) public  view returns(bool);

    function getProvider(uint number,address _tokenAddress)  public view returns(address);

    function getToken(uint number)  public view returns(address);
}
