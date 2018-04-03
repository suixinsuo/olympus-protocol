contract PriceOracleInterface {

   function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);

  function getNewDefaultPrice(address _tokenAddress) public view returns(uint);

  function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);

  function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);

     function checkTokenSupported(address tokenAddress) view returns(bool success);
     function checkExchangeSupported(bytes32 Exchanges) view returns(bool success);
     function checkProviderSupported(address providerAddress,address tokenAddress) view returns(bool success);ion getToken(uint number) view returns(address);

