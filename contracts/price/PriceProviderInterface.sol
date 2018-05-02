pragma solidity ^0.4.19;

contract PriceProviderInterface {
    
    function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);
    function getNewDefaultPrice(address _tokenAddress) public view returns(uint);
    function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);
    function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);
    function checkTokenSupported(address tokenAddress)  public view returns(bool success);
    function checkExchangeSupported(bytes32 Exchanges)  public view returns(bool success);
    function checkProviderSupported(address providerAddress,address tokenAddress)  public view returns(bool success);
    function getrates(address dest, uint srcQty)  public view returns (uint expectedRate, uint slippageRate);
}
