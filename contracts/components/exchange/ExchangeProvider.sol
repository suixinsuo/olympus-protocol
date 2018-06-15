pragma solidity 0.4.24;

import "../../interfaces/implementations/OlympusExchangeAdapterManagerInterface.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";
import "../../libs/utils.sol";


contract ExchangeProvider is OlympusExchangeInterface {

    OlympusExchangeAdapterManagerInterface private exchangeManager;

    function setExchangeManager(address _exchangeManager) external onlyOwner {
        exchangeManager = OlympusExchangeAdapterManagerInterface(_exchangeManager);
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
