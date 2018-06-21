pragma solidity 0.4.24;

import "../../Derivative.sol";
import "../../components/base/ComponentContainer.sol";
import "../../interfaces/MarketplaceInterface.sol";

contract MockDerivative is  Derivative {

    uint256 public totalSupply = 0;
    string public name = "Dummy";
    uint256 public decimals = 18;
    string public symbol = "DMY";


    // ------------  DERIVATIVE ------------
    function invest() public payable returns(bool success) {return true;}
    function changeStatus(DerivativeStatus) public returns(bool) {return true;}
    function getPrice() public view returns(uint)  { return 10**decimals;}

}

