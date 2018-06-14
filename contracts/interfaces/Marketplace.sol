pragma solidity 0.4.24;


contract Marketplace {

    address[] public products;

    function registerProduct() external returns(bool success);
    function getOwnProducts() external returns (address[] addresses);
}