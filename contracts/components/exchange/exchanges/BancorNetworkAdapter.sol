pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../../interfaces/implementations/BancorConverterInterface.sol";
import "../../../libs/ERC20Extended.sol";

contract BancorNetworkAdapter is OlympusExchangeAdapterInterface {
    using SafeMath for uint256;

    address public exchangeAdapterManager;
    bytes32 public exchangeId;
    bytes32 public name;
    ERC20Extended public constant ETH_TOKEN_ADDRESS = ERC20Extended(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    ERC20Extended public constant bancorToken = ERC20Extended(0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C);
    ERC20Extended public constant bancorETHToken = ERC20Extended(0xc0829421C1d260BD3cB3E0F06cfE2D52db2cE315);
    mapping(address => BancorConverterInterface) public tokenToConverter;
    mapping(address => address) public tokenToRelay;

    bool public adapterEnabled;

    modifier checkArrayLengths(address[] tokenAddresses, BancorConverterInterface[] converterAddresses, address[] relayAddresses) {
        require(tokenAddresses.length == converterAddresses.length && relayAddresses.length == converterAddresses.length);
        _;
    }

    modifier checkTokenSupported(address _token) {
        BancorConverterInterface bancorConverter = tokenToConverter[_token];
        require(address(bancorConverter) != 0x0, "Token not supported");
        _;
    }

    modifier checkTokenBalance(ERC20Extended _token, uint _amount) {
        // Tokens needs to be transferred to here before this function is called
        require(_token.balanceOf(address(this)) >= _amount, "Balance of token is not sufficient in adapter");
        _;
    }

    constructor (address _exchangeAdapterManager, address[] _tokenAddresses,
    BancorConverterInterface[] _converterAddresses, address[] _relayAddresses)
    checkArrayLengths(_tokenAddresses, _converterAddresses, _relayAddresses) public {
        updateSupportedTokenList(_tokenAddresses, _converterAddresses, _relayAddresses);
        exchangeAdapterManager = _exchangeAdapterManager;
        adapterEnabled = true;
    }

    modifier onlyExchangeAdapterManager() {
        require(msg.sender == address(exchangeAdapterManager));
        _;
    }

    function updateSupportedTokenList(address[] _tokenAddresses, BancorConverterInterface[] _converterAddresses, address[] _relayAddresses)
    checkArrayLengths(_tokenAddresses, _converterAddresses, _relayAddresses)
    public onlyOwner returns (bool success) {
        for(uint i = 0; i < _tokenAddresses.length; i++){
            tokenToConverter[_tokenAddresses[i]] = _converterAddresses[i];
            tokenToRelay[_tokenAddresses[i]] = _relayAddresses[i];
        }
        return true;
    }

    function supportsTradingPair(address _srcAddress, address _destAddress) external view returns(bool supported){
        address _tokenAddress = ETH_TOKEN_ADDRESS == _srcAddress ? _destAddress : _srcAddress;
        BancorConverterInterface bancorConverter = tokenToConverter[_tokenAddress];
        return address(bancorConverter) != 0x0;
    }

    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount)
    external view returns(uint expectedRate, uint slippageRate) {
        require(_amount > 0);
        bool isBuying = _sourceAddress == ETH_TOKEN_ADDRESS;
        ERC20Extended targetToken = isBuying ? _destAddress : _sourceAddress;
        BancorConverterInterface BNTConverter = tokenToConverter[address(bancorToken)];

        uint rate;
        BancorConverterInterface targetTokenConverter = tokenToConverter[address(targetToken)];

        if(isBuying){
            // Get amount of BNT for amount ETH
            uint ETHToBNTRate = BNTConverter.getReturn(bancorETHToken, bancorToken, _amount);
            // Get amount of tokens for the amount of BNT for amount ETH
            rate = targetTokenConverter.getReturn(bancorToken, targetToken, ETHToBNTRate);
            // Convert rate to 1ETH to token or token to 1 ETH
            rate = ((rate * 10**18) / _amount);
        } else {
            uint targetTokenToBNTRate = targetTokenConverter.getReturn(targetToken, bancorToken, 10**targetToken.decimals());
            rate = BNTConverter.getReturn(bancorToken, bancorETHToken, targetTokenToBNTRate);
            // Convert rate to 1ETH to token or token to 1 ETH
            rate = ((rate * 10**_sourceAddress.decimals()) / _amount);
        }



        // TODO slippage?
        return (rate,0);
    }

    // https://support.bancor.network/hc/en-us/articles/360000878832-How-to-use-the-quickConvert-function
    function getPath(ERC20Extended _token, bool isBuying) public view returns(ERC20Extended[] tokenPath) {
        BancorConverterInterface bancorConverter = tokenToConverter[_token];
        ERC20Extended relayAddress = ERC20Extended(tokenToRelay[_token]);
        uint pathLength;
        ERC20Extended[] memory path;

        // When buying, we can get the path from Bancor easily, by getting the quickBuyPath from the converter address
        if(isBuying){
            pathLength = bancorConverter.getQuickBuyPathLength();
            require(pathLength > 0, "Error with pathLength");
            path = new ERC20Extended[](pathLength);

            for (uint i = 0; i < pathLength; i++) {
                path[i] = bancorConverter.quickBuyPath(i);
            }
            return path;
        }

        // When selling, we need to make the path ourselves
        path = new ERC20Extended[](7);
        path[0] = _token;               // ERC20 Token to sell
        path[1] = relayAddress;         // Relay address (automatically converted to converter address)
        path[2] = relayAddress;         // Relay address (used as "to" token)
        path[3] = relayAddress;         // Relay address (used as "from" token)
        path[4] = bancorToken;          // BNT Smart token address, as converter
        path[5] = bancorToken;          // BNT Smart token address, as "to" and "from" token
        path[6] = bancorETHToken;       // The Bancor ETH token, this will signal we want our return in ETH

        return path;
    }

    // In contrast to Kyber, Bancor uses a minimum return for the complete trade, instead of a minimum rate for 1 ETH (for buying) or token (when selling)
    function convertMinimumRateToMinimumReturn(ERC20Extended _token, uint _minimumRate, uint _amount, bool isBuying)
    private view returns(uint minimumReturn) {
        if(isBuying){
            return (_amount * 10**18) / _minimumRate;
        }

        return (_amount * 10**_token.decimals()) / _minimumRate;
    }

    function sellToken
    (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress
    ) checkTokenSupported(_token) checkTokenBalance(_token, _amount) external returns(bool success) {
        ERC20Extended[] memory path = getPath(_token, false);

        BancorConverterInterface bancorConverter = tokenToConverter[_token];

        _token.approve(address(bancorConverter), 0);
        _token.approve(address(bancorConverter), _amount);
        uint minimumReturn = convertMinimumRateToMinimumReturn(_token,_amount,_minimumRate, false);
        uint returnedAmountOfETH = bancorConverter.quickConvert(path,_amount,minimumReturn);
        require(returnedAmountOfETH > 0, "BancorConverter did not return any ETH");
        _depositAddress.transfer(returnedAmountOfETH);
        return true;
    }

    function buyToken (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress
    ) checkTokenSupported(_token) external payable returns(bool success){
        require(msg.value == _amount, "Amount of Ether sent is not the same as the amount parameter");
        ERC20Extended[] memory path = getPath(_token, true);

        BancorConverterInterface BNTConverter = tokenToConverter[address(bancorToken)];

        uint minimumReturn = convertMinimumRateToMinimumReturn(_token,_amount,_minimumRate, true);
        uint returnedAmountOfTokens = BNTConverter.quickConvert.value(_amount)(path,_amount,minimumReturn);
        require(returnedAmountOfTokens > 0, "BancorConverter did not return any tokens");
        require(_token.transfer(_depositAddress, returnedAmountOfTokens), "Token transfer failure");
        return true;
    }

    function enable() external onlyOwner returns(bool){
        adapterEnabled = true;
        return true;
    }

    function disable() external onlyOwner returns(bool){
        adapterEnabled = false;
        return true;
    }

    function isEnabled() external view returns (bool success) {
        return adapterEnabled;
    }

    function setExchangeAdapterManager(address _exchangeAdapterManager) external onlyOwner {
        exchangeAdapterManager = _exchangeAdapterManager;
    }

    function setExchangeDetails(bytes32 _id, bytes32 _name)
    external onlyExchangeAdapterManager returns(bool)
    {
        exchangeId = _id;
        name = _name;
        return true;
    }

    function getExchangeDetails()
    external view returns(bytes32 _name, bool _enabled)
    {
        return (name, adapterEnabled);
    }
}
