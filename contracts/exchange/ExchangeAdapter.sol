pragma solidity ^0.4.17;
import "./Interfaces.sol";
import "./ExchangeAdapterBase.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../libs/utils.sol";

contract ExchangeAdapter is ExchangeAdapterBase, Ownable, Utils {

    IAdapterOrderCallback adapterOrderCallback;

    string public name;
    Status public status;

    function setName(string _n) public returns (string) {
        return name = _n;
    }

    // TODO: ownerable
    function setAdapterOrderCallback(IAdapterOrderCallback _callback) public{
        adapterOrderCallback = _callback;
    }

    function isEnabled() external view returns (bool success) {
        return status == Status.ENABLED;
    }

    /// >0 : current exchange rate
    /// =0 : not support
    /// <0 : support but doesn't know rate
    function getRate(ERC20 token, uint amount) external view returns(int);

    function placeOrder(ERC20 dest, uint amount, uint rate, address deposit) external payable returns(uint adapterOrderId);

    function payOrder(uint adapterOrderId) external payable returns(bool);

    function cancelOrder(uint adapterOrderId) external returns(bool);
    function getOrderStatus(uint adapterOrderId) external view returns(OrderStatus);
}