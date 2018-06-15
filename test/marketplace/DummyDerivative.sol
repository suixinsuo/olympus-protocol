pragma solidity 0.4.24;

import "../../contracts/interfaces/DerivativeInterface.sol";
import "../../contracts/components/base/ComponentContainer.sol";
import "../../contracts/interfaces/MarketplaceInterface.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract DummyDerivative is StandardToken, DerivativeInterface, ComponentContainer  {

    string private constant MARKET = "MarketPlace";
    uint256 public totalSupply = 0;
    string public name = "Dummy";
    uint256 public decimals = 18;
    string public symbol = "DMY";


    // Can change from market place
    function register(address marketplace) external onlyOwner  returns(bool) {
        require(MarketplaceInterface(marketplace).registerProduct());
        require(setComponent(MARKET, marketplace));

    }
    // ------------  DERIVATIVE ------------
    function invest() public payable returns(bool success) {return true;}
    function changeStatus(DerivativeStatus) public returns(bool) {return true;}
    function getPrice() public view returns(uint)  { return 0;}


}

