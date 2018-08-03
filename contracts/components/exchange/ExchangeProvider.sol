pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../libs/ERC20NoReturn.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterManagerInterface.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";
import "../../libs/utils.sol";
import "../../components/base/FeeCharger.sol";

contract ExchangeProvider is FeeCharger, OlympusExchangeInterface {
    using SafeMath for uint256;
    string public name = "OlympusExchangeProvider";
    string public description =
    "Exchange provider of Olympus Labs, which additionally supports buy\and sellTokens for multiple tokens at the same time";
    string public category = "exchange";
    string public version = "v1.0";
    ERC20Extended private constant ETH  = ERC20Extended(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    uint public registerTradeFailureInterval = 1 days;
    bytes4 public constant BUY_FUNCTION_SELECTOR = bytes4(keccak256("buyToken(address,uint256,uint256,address)"));
    bytes4 public constant SELL_FUNCTION_SELECTOR = bytes4(keccak256("sellToken(address,uint256,uint256,address)"));
    uint public failureFeeToDeduct = 0;
    uint sellMultipleTokenFee = 0; // All tokens to MOT price, to pay fee at the end
    bool functionCompleteSuccess = true;

    // exchangeId > sourceAddress > destAddress
    mapping(bytes32 => mapping(address => mapping(address => uint))) public currentPriceExpected;
    mapping(bytes32 => mapping(address => mapping(address => uint))) public currentPriceSlippage;
    mapping(bytes32 => mapping(address => mapping(address => uint))) public lastCachedPriceTime;
    // msg.sender => sourceAddress > destAddress
    mapping(address => mapping(address => mapping(address => uint))) firstTradeFailure;
    mapping(address => mapping(address => mapping(address => uint))) amountOfTradeFailures;
    mapping(address => mapping(address => mapping(address => uint))) lastTradeFailure;

    OlympusExchangeAdapterManagerInterface private exchangeAdapterManager;

    constructor(address _exchangeManager) public {
        exchangeAdapterManager = OlympusExchangeAdapterManagerInterface(_exchangeManager);
        feeMode = FeeMode.ByTransactionAmount;
    }

    modifier checkAllowance(ERC20Extended _token, uint _amount) {
        require(_token.allowance(msg.sender, address(this)) >= _amount, "Not enough tokens approved");
        _;
    }

    function setExchangeAdapterManager(address _exchangeManager) external onlyOwner {
        exchangeAdapterManager = OlympusExchangeAdapterManagerInterface(_exchangeManager);
    }

    function exitTrade(address _sourceAddress, address _destAddress, uint _amount, address _adapter, bool _needToRefund) private {

        // Updating lastTradeFailure
        if (lastTradeFailure[msg.sender][_sourceAddress][_destAddress].add(registerTradeFailureInterval) < now) {
            if (amountOfTradeFailures[msg.sender][_sourceAddress][_destAddress] == 0) {
                firstTradeFailure[msg.sender][_sourceAddress][_destAddress] = now;
            }
            amountOfTradeFailures[msg.sender][_sourceAddress][_destAddress]++;
            lastTradeFailure[msg.sender][_sourceAddress][_destAddress] = now;
        }

        // Refund user
        if(_sourceAddress == address(ETH)){
            msg.sender.transfer(_amount);
        } else if(_needToRefund) {
            uint beforeBalance = ERC20Extended(_sourceAddress).balanceOf(msg.sender);
            ERC20Extended(_sourceAddress).transferFrom(_adapter, msg.sender, _amount);
            require(ERC20Extended(_sourceAddress).balanceOf(msg.sender) == beforeBalance.add(_amount));
        }
    }

    function registerSuccesfullTrade(address _sourceAddress, address _destAddress) private {
        if(firstTradeFailure[msg.sender][_sourceAddress][_destAddress] == 0){
            // Guard, we don't need to write to storage if the previous trades were succesfull
            return;
        }
        firstTradeFailure[msg.sender][_sourceAddress][_destAddress] = 0;
        amountOfTradeFailures[msg.sender][_sourceAddress][_destAddress] = 0;
        lastTradeFailure[msg.sender][_sourceAddress][_destAddress] = 0;
    }

    function buyToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress, bytes32 _exchangeId
        ) external payable returns(bool success) {
        require(msg.value == _amount);

        OlympusExchangeAdapterInterface adapter;
        // solhint-disable-next-line
        bytes32 exchangeId = _exchangeId == "" ? exchangeAdapterManager.pickExchange(_token, _amount, _minimumRate, true) : _exchangeId;
        if(exchangeId == 0){
            exitTrade(address(ETH), address(_token), msg.value, address(adapter), true);
            return false;
        }
        adapter = OlympusExchangeAdapterInterface(exchangeAdapterManager.getExchangeAdapter(exchangeId));

        bool result = address(adapter).call.value(
            msg.value)(BUY_FUNCTION_SELECTOR,_token,_amount,_minimumRate, _depositAddress);
        if (!result) {
            exitTrade(address(ETH), address(_token), msg.value, address(adapter), true);
            return false;
            //return (false, amountOfTradeFailures[msg.sender][address(ETH)][address(_token)]);
        }

        uint fee = msg.value.mul(getMotPrice()).div(10 ** 18);
        require(payFee(fee));
        registerSuccesfullTrade(address(ETH), address(_token));
        return true;
        //return (true, 0);
    }

    function updateInterval(uint _registerTradeFailureInterval) external onlyOwner returns (bool success){
        registerTradeFailureInterval = _registerTradeFailureInterval;
        return true;
    }

    function sellToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress, bytes32 _exchangeId
        ) checkAllowance(_token, _amount) external returns(bool success) {

        OlympusExchangeAdapterInterface adapter;
        bytes32 exchangeId = _exchangeId == "" ? exchangeAdapterManager.pickExchange(_token, _amount, _minimumRate, false) : _exchangeId;
        if(exchangeId == 0) {
            // Tokens are not transferred yet, so we don't need to refund.
            exitTrade(address(_token), address(ETH), _amount, address(adapter), false);
            return false;
        }

        adapter = OlympusExchangeAdapterInterface(exchangeAdapterManager.getExchangeAdapter(exchangeId));

        // Let the adapter approve the token for the exchange provider address, so that in the event of a failure, we can return the tokens
        // This is needed because we use the low level call for function selector, which doesn't propagate the error
        if (_token.allowance(address(adapter), address(this)) == 0) {
            adapter.approveToken(_token);
        }
        ERC20NoReturn(_token).transferFrom(msg.sender, address(adapter), _amount);

        bool result = address(adapter).call(SELL_FUNCTION_SELECTOR,_token,_amount,_minimumRate, _depositAddress);
        if (!result) {
            exitTrade(address(_token), address(ETH), _amount, address(adapter), true);
            return false;
            //return (false, amountOfTradeFailures[msg.sender][address(ETH)][address(_token)]);
        }
        require(payFee(sellTokenFee(_token,_amount, exchangeId)));
        registerSuccesfullTrade(address(_token), address(ETH));

        return true;
        //return (true, 0);
    }

    function getMotPrice() private view returns (uint price) {
        (price,) = exchangeAdapterManager.getPrice(ETH, MOT, 10**18, 0x0);
    }

    function checkTotalValue(uint[] _amounts) private view {
        uint totalValue;
        uint i;
        for(i = 0; i < _amounts.length; i++ ) {
            totalValue = totalValue.add(_amounts[i]);
        }
        require(totalValue == msg.value, "msg.value is not the same as total value");
    }

    function getFailedTradesArray(ERC20Extended[] _tokens) private view returns (uint[] memory failedTimes) {
        failedTimes = new uint[](_tokens.length);
        for(uint i = 0; i < _tokens.length; i++){
            failedTimes[i] = amountOfTradeFailures[msg.sender][address(ETH)][address(_tokens[i])];
        }
        return failedTimes;
    }

    function buyTokens
        (
        ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates,
        address _depositAddress, bytes32 _exchangeId
        ) external payable returns(bool success) {
        failureFeeToDeduct = 0;
        require(_tokens.length == _amounts.length && _amounts.length == _minimumRates.length, "Arrays are not the same lengths");
        uint i;
        OlympusExchangeAdapterInterface adapter;
        bool completeSuccess = true;

        for (i = 0; i < _tokens.length; i++ ) {
            adapter = OlympusExchangeAdapterInterface(
                exchangeAdapterManager.getExchangeAdapter(_exchangeId == "" ?
                exchangeAdapterManager.pickExchange(_tokens[i], _amounts[i], _minimumRates[i], true) : _exchangeId));
            if(address(adapter) == 0x0) {
                completeSuccess = false;
                failureFeeToDeduct += _amounts[i];
                exitTrade(address(ETH), address(_tokens[i]), _amounts[i], address(adapter), true);
                continue;
            }
            if (!(address(adapter).call.value(
                _amounts[i])(BUY_FUNCTION_SELECTOR,_tokens[i],_amounts[i],_minimumRates[i],_depositAddress))) {
                completeSuccess = false;
                failureFeeToDeduct += _amounts[i];
                exitTrade(address(ETH), address(_tokens[i]), _amounts[i], address(adapter), true);
                continue;
            }
            registerSuccesfullTrade(address(ETH), address(_tokens[i]));
        }
        require(payFee(buyTokenFee(msg.value-failureFeeToDeduct)));
        // return (completeSuccess, getFailedTradesArray(_tokens));
        return completeSuccess;
    }

    function sellTokens
        (
        ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates,
        address _depositAddress, bytes32 _exchangeId
        ) external returns(bool success) {
        sellMultipleTokenFee = 0;
        require(_tokens.length == _amounts.length && _amounts.length == _minimumRates.length, "Arrays are not the same lengths");
        OlympusExchangeAdapterInterface adapter;
        uint i;
        for (i = 0; i < _tokens.length; i++ ) {
            adapter = OlympusExchangeAdapterInterface(
                exchangeAdapterManager.getExchangeAdapter(_exchangeId == "" ?
                exchangeAdapterManager.pickExchange(_tokens[i], _amounts[i], _minimumRates[i], true) : _exchangeId));
            if (address(adapter) == 0x0) {
                functionCompleteSuccess = false;
                exitTrade(address(_tokens[i]), address(ETH), _amounts[i], address(adapter), false);
                continue;
            }
            require(_tokens[i].allowance(msg.sender, address(this)) >= _amounts[i], "Not enough tokens approved");
            ERC20NoReturn(_tokens[i]).transferFrom(msg.sender, address(adapter), _amounts[i]);
            if (!(address(adapter).call(SELL_FUNCTION_SELECTOR,_tokens[i],_amounts[i],_minimumRates[i], _depositAddress))) {
                functionCompleteSuccess = false;
                exitTrade(address(_tokens[i]), address(ETH), _amounts[i], address(adapter), true);
                continue;
                //return (false, amountOfTradeFailures[msg.sender][address(ETH)][address(_token)]);
            }
            registerSuccesfullTrade(address(_tokens[i]), address(ETH));
            sellMultipleTokenFee = sellMultipleTokenFee.add(sellTokenFee(
                _tokens[i], _amounts[i], _exchangeId));
        }

        require(payFee(sellMultipleTokenFee));
        return functionCompleteSuccess;
        // return (functionCompleteSuccess, getFailedTradesArray(_tokens));

    }

    function supportsTradingPair(address _srcAddress, address _destAddress, bytes32 _exchangeId) external view returns (bool){
        return exchangeAdapterManager.supportsTradingPair(_srcAddress, _destAddress, _exchangeId);
    }

    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId)
        external view returns(uint expectedRate, uint slippageRate) {
        return exchangeAdapterManager.getPrice(_sourceAddress, _destAddress, _amount, _exchangeId);
    }

    function getPriceOrCacheFallback(
        ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId, uint _maxPriceAgeIfCache)
        external returns(uint expectedRate, uint slippageRate, bool isCached) {
        uint _currentPriceExpected;
        uint _currentPriceSlippage;
        (_currentPriceExpected, _currentPriceSlippage) = exchangeAdapterManager.getPrice(_sourceAddress, _destAddress, _amount, _exchangeId);
        if (_currentPriceExpected > 0){
            currentPriceExpected[_exchangeId][_sourceAddress][_destAddress] = _currentPriceExpected;
            currentPriceSlippage[_exchangeId][_sourceAddress][_destAddress] = _currentPriceSlippage;
            lastCachedPriceTime[_exchangeId][_sourceAddress][_destAddress] = now;
            return (
                _currentPriceExpected,
                _currentPriceSlippage,
                false
            );
        }
        if (lastCachedPriceTime[_exchangeId][_sourceAddress][_destAddress].add(_maxPriceAgeIfCache) < now) {
            return (
                0,
                0,
                false
            );
        }
        return (
            currentPriceExpected[_exchangeId][_sourceAddress][_destAddress],
            currentPriceSlippage[_exchangeId][_sourceAddress][_destAddress],
            true
        );
    }

    function sellTokenFee(ERC20Extended _token, uint _amount, bytes32 _exchangeId) internal view returns (uint) {
        uint tokenPrice;
        (tokenPrice,) = exchangeAdapterManager.getPrice(_token, ETH, _amount, _exchangeId);
        return tokenPrice.mul(_amount).mul(getMotPrice()).div(10 ** _token.decimals()).div(10 ** 18);
    }

    function buyTokenFee(uint _value) internal view returns(uint) {
        return _value.mul(getMotPrice()).div(10 ** 18);
    }
}
