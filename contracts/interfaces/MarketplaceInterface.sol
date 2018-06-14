pragma solidity 0.4.24;

import "../libs/Ownable.sol";


contract MarketplaceInterface is Ownable {

    address[] public products;
    mapping(address => address[]) public productMappings;

    function registerProduct() external returns(bool success);
    function getOwnProducts() external view returns (address[] addresses);
}