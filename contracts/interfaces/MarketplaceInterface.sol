pragma solidity 0.4.24;


contract MarketplaceInterface {

    address[] public products;

    function registerProduct() external returns(bool success);
    function getOwnProducts() external returns (address[] addresses);
}