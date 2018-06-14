pragma solidity 0.4.23;

import "../../contracts/interfaces/DerivativeInterface.sol";
import "../../contracts/components/base/ComponentContainer.sol";
import "../../contracts/interfaces/MarketplaceInterface.sol";


contract DummyDelivative is  DerivativeInterface, ComponentContainer {

    string private constant MARKET = "MarketPlace";

    // Require to be register on creation
    constructor (address marketplace) {
        require(setComponent(MARKET, marketplace));
        require(MarketplaceInterface(marketplace).registerProduct());
    }

    // Can change from market place
    function register(address marketplace) external onlyOwner returns(bool) {
        require(setComponent(MARKET, marketplace));
        return MarketplaceInterface(marketplace).registerProduct();
    }
}
