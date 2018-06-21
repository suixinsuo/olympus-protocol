
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";

contract MockMarketClient is MockDerivative {

    string public constant MARKET = "Marketplace";

    // Can change from market place
    function register(address marketplace) external onlyOwner returns(bool) {
        require(MarketplaceInterface(marketplace).registerProduct());
        require(setComponent(MARKET, marketplace));
        return true;
    }
}

