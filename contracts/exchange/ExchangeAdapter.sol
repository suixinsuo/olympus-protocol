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
}