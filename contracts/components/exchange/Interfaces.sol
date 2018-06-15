pragma solidity 0.4.24;

import "../../libs/ERC20.sol";
import "./ExchangeAdapterBase.sol";

interface IExchangeAdapterManager {
    function pickExchange(ERC20 token, uint amount, uint rate) external view returns (bytes32 exchangeId);
    function checkTokenSupported(ERC20 token) external view returns(bool);
    function getExchangeAdapter(bytes32 exchangeId) external view returns(address);
    function isValidAdapter(address adapter) external view returns(bool);
}

interface IAdapterOrderCallback{
    function adapterApproved(
        uint adapterOrderId, address tokenOwner, address payee,
        uint srcCompletedAmount, uint destCompletedAmount) external returns (bool);
}

interface IExchangeAdapter{
    function placeOrderQuicklyToBuy(bytes32 /*id*/, ERC20 dest, uint amount, uint rate, address deposit) external payable returns(bool);
    function placeOrderQuicklyToSell(bytes32 /*id*/, ERC20 dest, uint amount, uint rate, address deposit) external payable returns(bool);

    function getDestCompletedAmount(uint adapterOrderId) external view returns(uint);

    /// >0 : current exchange rate
    /// =0 : not support
    /// <0 : support but doesn't know rate
    function getRate(bytes32 exchangeId, ERC20 token, uint amount) external view returns (int);
    function getRateToSell(bytes32 exchangeId, ERC20 token, uint amount) external view returns (int);

    function isEnabled(bytes32 _id) external view returns (bool);

    function getExchange(bytes32 _id) external view returns(bytes32 name, bool adapterEnabled);

    function addExchange(bytes32 _id, bytes32 _name) external returns(bool);
}
