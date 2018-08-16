pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ComponentContainerInterface.sol";

contract DerivativeInterface is ERC20Extended, Ownable, ComponentContainerInterface {

    enum DerivativeStatus { New, Active, Paused, Closed }
    enum DerivativeType { Index, Fund }

    string public description;
    string public category;
    string public version;
    DerivativeType public fundType;

    address[] public tokens;
    DerivativeStatus public status;

    // invest, withdraw is done in transfer.
    function invest() public payable returns(bool success);
    // function changeStatus(DerivativeStatus _status) public returns(bool);
    function getPrice() public view returns(uint);

    function _initialize (address _componentList) internal;
    function updateComponent(bytes32 _name) public returns (address);
    function approveComponent(bytes32 _name) internal;
}
