pragma solidity 0.4.24;

import "../../Derivative.sol";
import "../../components/base/ComponentContainer.sol";
import "../../interfaces/MarketplaceInterface.sol";

import "../../interfaces/DerivativeInterface.sol";
import "../base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract MockDerivative is  DerivativeInterface, ComponentContainer, StandardToken {

    string public name = "Dummy";
    uint256 public decimals = 18;
    string public symbol = "DMY";



    // ------------  DERIVATIVE MOCK UP------------
    function invest() public payable returns(bool success) {return true;}
    // function changeStatus(DerivativeStatus _status) pure returns(bool) {return true;}
    function getPrice() public view returns(uint) { return 10**decimals; }

    function _initialize (address /*_componentList*/) internal { }

    function updateComponent(bytes32 /*_name*/) public onlyOwner returns (address) {  return address(0x0);  }

    function approveComponent(bytes32 /*_name*/) internal { }

    function () public payable {

    }
}
