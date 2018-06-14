pragma solidity ^0.4.24;

import "./Interfaces.sol";
import "./ExchangeProviderInterface.sol";
import { ExchangeAdapterBase as EAB} from "./ExchangeAdapterBase.sol";
import "../../libs/utils.sol";

contract ExchangeProvider is ExchangeProviderInterface {

    IExchangeAdapterManager exchangeManager;

    mapping (uint => uint) private balances;

    constructor () public {

    }

    function setExchangeManager(address _exchangeManager) public /* TODO modifier */ {
        _setExchangeManager(_exchangeManager);
    }

    function _setExchangeManager(address _exchangeManager) private  {
        exchangeManager = IExchangeAdapterManager(_exchangeManager);
    }

    modifier onlyAdapter(){
        require(exchangeManager.isValidAdapter(msg.sender));
        _;
    }

    function buyToken(bytes32 /*id*/, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external payable returns(bool) {
        IExchangeAdapter adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]);
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
    function sellToken(bytes32 /*id*/, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external returns(bool) {
        IExchangeAdapter adapter;
        for (uint i = 0; i < tokens.length; i++ ) {
            bytes32 exchangeId = exchangeManager.pickExchange(tokens[i], amounts[i], rates[i]);
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
