pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ComponentContainerInterface.sol";

contract DerivativeInterface is  Ownable, ComponentContainerInterface {

    enum DerivativeStatus { New, Active, Paused, Closed }
    enum DerivativeType { Index, Fund, Future, BinaryFuture }

    string public description;
    bytes32 public category;

    bytes32 public version;
    DerivativeType public fundType;
    DerivativeStatus public status;


    function _initialize (address _componentList) internal;
    function updateComponent(bytes32 _name) public returns (address);
    function approveComponent(bytes32 _name) internal;


}
