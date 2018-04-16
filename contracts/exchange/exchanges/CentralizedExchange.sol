pragma solidity ^0.4.17;

import "../Interfaces.sol"; 
import "../ExchangeAdapterBase.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract CentralizedExchange is ExchangeAdapterBase {

    IAdapterOrderCallback adapterOrderCallback;

    struct Exchange {
        bytes32  name;   
        Status   status;
    }
    mapping (bytes32=>Exchange) exchanges;

    Status public status;

    // TODO: ownerable
    function setAdapterOrderCallback(IAdapterOrderCallback _callback) public{
        adapterOrderCallback = _callback;
    }

    function addExchange(bytes32 _id, bytes32 _name)
    public returns(bool)
    {
        require(!isEmpty(_name));
        require(isEmpty(exchanges[_id].name));

        exchanges[_id] = Exchange({
            name:_name,
            status:Status.ENABLED // default is ENABLED
        });
        return true;
    }

    function getExchange(bytes32 _id)
    public view returns(bytes32, Status)
    {
        Exchange memory e = exchanges[_id];
        require(!isEmpty(e.name));
        return (e.name, e.status);
    }

    function enable(bytes32 _id) public returns(bool){
        require(!isEmpty(exchanges[_id].name));
        exchanges[_id].status = Status.ENABLED;
        return true;
    }

    function disable(bytes32 _id) public returns(bool){
        require(!isEmpty(exchanges[_id].name));
        exchanges[_id].status = Status.DISABLED;
        return true;
    }

    function isEnabled(bytes32 _id) external view returns (bool success) {
        require(!isEmpty(exchanges[_id].name));
        return exchanges[_id].status == Status.ENABLED;
    }

    function isEmpty(bytes32 str) private pure returns(bool){
        return str == 0;
    }
}