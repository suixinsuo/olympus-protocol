pragma solidity 0.4.24;

import "../../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../../interfaces/implementations/BancorConverterInterface.sol";
import "../../../libs/ERC20Extended.sol";

contract BancorNetworkAdapter is OlympusExchangeAdapterInterface {

    address public exchangeAdapterManager;
    bytes32 public exchangeId;
    bytes32 public name;
    ERC20Extended public constant ETH_TOKEN_ADDRESS = ERC20Extended(0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    ERC20Extended public constant bancorToken = ERC20Extended(0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c);
    ERC20Extended public constant bancorETHToken = ERC20Extended(0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315);
    mapping(address => BancorConverterInterface) public tokenToConverter;

    constructor (address _exchangeAdapterManager, address[] tokenAddresses,
    BancorConverterInterface[] converterAddresses) public {
        require(tokenAddresses.length == converterAddresses.length);
        for(uint i = 0; i < tokenAddresses.length; i++){
            tokenToConverter[tokenAddresses[i]] = converterAddresses[i];
        }
        exchangeAdapterManager = _exchangeAdapterManager;
        adapterEnabled = true;
    }

    function updateTokenToConverterList(address[] tokenAddresses, BancorConverterInterface[] converterAddresses)
    public onlyOwner returns (bool success) {
        require(tokenAddresses.length == converterAddresses.length);
        for(uint i = 0; i < tokenAddresses.length; i++){
            tokenToConverter[tokenAddresses[i]] = converterAddresses[i];
        }
        return true;
    }

    function supportsTradingPair(address _srcAddress, address _destAddress) external view returns(bool supported){
        return true; // TODO
    }

    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint /*_amount*/)
    external view returns(uint expectedRate, uint slippageRate) {
        bool isBuying = _sourceAddress == ETH_TOKEN_ADDRESS;
        ERC20Extended targetToken = isBuying ? _destAddress : _sourceAddress;
        BancorConverterInterface BNTConverter = tokenToConverter(address(bancorToken));

        uint rate;
        BancorConverterInterface targetTokenConverter = tokenToConverter(address(targetToken));

        if(isBuying){
            // Get amount of BNT for 1 ETH
            uint ETHToBNTRate = BNTConverter.getReturn(bancorETHToken, bancorToken, 10**18);
            // Get amount of tokens for the amount of BNT for 1 ETH
            rate = targetTokenConverter.getReturn(bancorToken, targetToken, ETHToBNTRate);
        } else {
            uint targetTokenToBNTRate = targetTokenConverter.getReturn(targetToken, bancorToken, 10**targetToken.decimals());
            rate = BNTConverter.getReturn(bancorToken, bancorETHToken, targetTokenToBNTRate);
        }

        // TODO slippage?
        return (rate,0);
    }

    function getPath(ERC20Extended _token, bool isBuying) public returns(ERC20Extended[] tokenPath) {
        BancorConverterInterface bancorConverter = tokenToConverter(_token);
        uint pathLength = bancorConverter.getQuickBuyPathLength();
        require(pathLength > 0, "Error with pathLength");
        ERC20Extended[] memory path = new ERC20Extended[](pathLength);

        for (uint i = 0; i < pathLength; i++) {
            path[i] = bancorConverter.quickBuyPath(isBuying ? i : pathLength - 1 - i);
        }
        return path;
    }

    function convertMinimumRateToMinimumReturn(ERC20Extended _token, uint _minimumRate, uint _amount, bool isBuying)
    internal pure returns(uint minimumReturn) {
        if(isBuying){
            return (_amount * 10**18) / _minimumRate;
        }

        return (_amount * 10**_token.decimals()) / _minimumRate;
    }

    function sellToken
    (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress
    ) external returns(bool success) {
        ERC20Extended[] memory path = getPath(_token, false);

        BancorConverterInterface bancorConverter = tokenToConverter(_token);
        if(address(bancorConverter) == 0x0){
            revert("Token not supported");
        }
        _token.approve(address(bancorConverter), _amount);
        uint minimumReturn = convertMinimumRateToMinimumReturn(_token,_amount,_minimumRate, false);
        uint returnedAmountOfETH = bancorConverter.quickConvert(path,_amount,minimumReturn);
        require(returnedAmountOfETH > 0, "BancorConverter did not return any ETH");
        require(_depositAddress.transfer(returnedAmountOfETH), "ETH transfer failure");
        return true;
    }

    function buyToken (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress
    ) external payable returns(bool success){
        ERC20Extended[] memory path = getPath(_token, true);

        BancorConverterInterface bancorConverter = tokenToConverter(_token);
        if(address(bancorConverter) == 0x0){
            revert("Token not supported");
        }
        uint minimumReturn = convertMinimumRateToMinimumReturn(_token,_amount,_minimumRate, true);
        uint returnedAmountOfTokens = bancorConverter.quickConvert.value(_amount)(path,_amount,minimumReturn);
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
