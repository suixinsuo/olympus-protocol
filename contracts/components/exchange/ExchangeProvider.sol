pragma solidity 0.4.24;

import "./Interfaces.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";
import { ExchangeAdapterBase as EAB} from "./ExchangeAdapterBase.sol";
import "../../libs/utils.sol";


contract ExchangeProvider is OlympusExchangeInterface {

    IExchangeAdapterManager private exchangeManager;

    mapping (uint => uint) private balances;

    function setExchangeManager(address _exchangeManager) external onlyOwner {
        exchangeManager = IExchangeAdapterManager(_exchangeManager);
    }

    function buyTokens(ERC20[] tokens, uint256[] amounts, uint256[] rates, bytes32 _exchangeId, address deposit) external payable returns(bool) {
        IExchangeAdapter adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]) : _exchangeId;
            if(exchangeId == 0){
                return false;
            }
            adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(exchangeId));
            require(
                adapter.placeOrderQuicklyToBuy.value(amounts[i])(
                    exchangeId,
                    tokens[i],
                    amounts[i],
                    rates[i],
                    deposit)
            );
        }
        return true;
    }
    function sellTokens(ERC20[] tokens, uint256[] amounts, uint256[] rates, bytes32 _exchangeId, address deposit) external returns(bool) {
        IExchangeAdapter adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = _exchangeId == "" ? exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]) : _exchangeId;
            if(exchangeId == 0){
                return false;
            }
            adapter = IExchangeAdapter(exchangeManager.getExchangeAdapter(exchangeId));
            //TODO need to add refund if transaction failed

            tokens[i].transfer(address(adapter), amounts[i]);
            // tokens[i].approve(exchangeManager.getExchangeAdapter(exchangeId), amounts[i]);
            require(
                adapter.placeOrderQuicklyToSell(
                    exchangeId,
                    tokens[i],
                    amounts[i],
                    rates[i],
                    deposit)
            );
        }
        return true;
    }

    function getExpectAmount(uint eth, uint destDecimals, uint rate) internal pure returns(uint){
        return Utils.calcDstQty(eth, 18, destDecimals, rate);
    }

    function checkTokenSupported(ERC20 token) external view returns (bool){
        require(address(token) != 0x0);
        return exchangeManager.checkTokenSupported(token);
    }
}
