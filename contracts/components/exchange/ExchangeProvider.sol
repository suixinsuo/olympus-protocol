pragma solidity 0.4.24;

import "../../interfaces/implementations/OlympusExchangeAdapterManagerInterface.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";
import "../../libs/utils.sol";


contract ExchangeProvider is OlympusExchangeInterface {
    string public name = "OlympusExchangeProvider";
    string public description = "Exchange provider of Olympus Labs, which additionally supports buy and sellTokens for multiple tokens at the same time";
    string public category = "exchange";
    string public version = "v1.0";

    OlympusExchangeAdapterManagerInterface private exchangeManager;

    function setExchangeManager(address _exchangeManager) external onlyOwner {
        exchangeManager = OlympusExchangeAdapterManagerInterface(_exchangeManager);
    }

    function buyToken
        (
        ERC20 _token, uint _amount, uint _minimumRate,
        address _depositAddress, bytes32 _exchangeId, address _partnerId
        ) external payable returns(bool success) {
        require(msg.value == _amount);
        OlympusExchangeAdapterInterface adapter;
        bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(_token, _amount, _minimumRate) : _exchangeId;
        if(exchangeId == 0){
            return false;
        }
        adapter = OlympusExchangeAdapterInterface(exchangeManager.getExchangeAdapter(exchangeId));
        require(
            adapter.buyToken.value(msg.value)(
                _token,
                _amount,
                _minimumRate,
                _depositAddress,
                "",
                _partnerId)
        );
        return true;
    }

    function sellToken
        (
        ERC20 _token, uint _amount, uint _minimumRate,
        address _depositAddress, bytes32 _exchangeId, address _partnerId
        ) external returns(bool success) {

        OlympusExchangeAdapterInterface adapter;
        bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(_token, _amount, _minimumRate) : _exchangeId;
        if(exchangeId == 0){
            return false;
        }
        adapter = OlympusExchangeAdapterInterface(exchangeManager.getExchangeAdapter(exchangeId));
        require(
            adapter.sellToken(
                _token,
                _amount,
                _minimumRate,
                _depositAddress,
                _partnerId)
            );
        return true;
    }

    function buyTokens(ERC20[] tokens, uint256[] amounts, uint256[] rates, bytes32 _exchangeId, address deposit) external payable returns(bool) {
        OlympusExchangeAdapterInterface adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]) : _exchangeId;
            if(exchangeId == 0){
                return false;
            }
            adapter = OlympusExchangeAdapterInterface(exchangeManager.getExchangeAdapter(exchangeId));
            require(
                adapter.buyToken.value(amounts[i])(
                    tokens[i],
                    amounts[i],
                    rates[i],
                    deposit,
                    "",
                    0x0)
            );
        }
        return true;
    }
    function sellTokens(ERC20[] tokens, uint256[] amounts, uint256[] rates, bytes32 _exchangeId, address deposit) external returns(bool) {
        OlympusExchangeAdapterInterface adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]) : _exchangeId;
            if(exchangeId == 0){
                return false;
            }
            adapter = OlympusExchangeAdapterInterface(exchangeManager.getExchangeAdapter(exchangeId));
            //TODO need to add refund if transaction failed

            tokens[i].transferFrom(msg.sender, address(adapter), amounts[i]);
            require(
                adapter.sellToken(
                    tokens[i],
                    amounts[i],
                    rates[i],
                    deposit,
                    0x0)
            );
        }
        return true;
    }

    function checkTokenSupported(ERC20 token) external view returns (bool){
        require(address(token) != 0x0);
        return exchangeManager.checkTokenSupported(token);
    }
}
