pragma solidity ^0.4.23;

import "./interfaces/MarketplaceInterface.sol";
import "./interfaces/DerivativeInterface.sol";


contract Marketplace is MarketplaceInterface {
    address[] public products;
    mapping(address => address[]) public productMappings;

    function registerProduct() external returns(bool success) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        products.push(msg.sender);

        address creator = derivative.getOwner();

        for (uint i = 0; i < productMappings[creator].length; i++) {
            require(productMappings[creator][i] != msg.sender);
        }
        productMappings[creator].push(msg.sender);

        return true;
    }

    function getOwnProducts() external view returns (address[] addresses) {
        return productMappings[msg.sender];
    }

}
