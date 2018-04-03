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
  
     function checkTokenSupported(address tokenAddress) view returns(bool success);
     function checkExchangeSupported(bytes32 Exchanges) view returns(bool success);
     function checkProviderSupported(address providerAddress,address tokenAddress) view returns(bool success);
 
}
