pragma solidity 0.4.24;

import "./interfaces/MarketplaceInterface.sol";
import "./interfaces/DerivativeInterface.sol";


contract Marketplace is MarketplaceInterface {

    string public name = "ProductList";
    string public description ="List of derivatives";
    string public category = "Lists";
    string public version = "v1.0";
    

    address[] public products;
    mapping(address => address[]) public productMappings;

    function getAllProducts() external view returns (address[] allProducts) {
        return products;
    }

    function getOwnProducts() external view returns (address[] addresses) {
        return productMappings[msg.sender];
    }

    // Will revert on duplicated products
    function registerProduct() external returns(bool success) {
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        address creator = derivative.owner();

        for (uint i = 0; i < productMappings[creator].length; i++) {
            require(productMappings[creator][i] != msg.sender);
        }
        productMappings[creator].push(msg.sender);
        products.push(msg.sender);

        emit Registered(msg.sender, creator);

        return true;
    }

}
