pragma solidity ^0.4.18;

import '../libs/Ownable.sol';
import '../libs/Provider.sol';

contract PriceProvider is Provider, Ownable {
    // For now, all price are ETH based.
    event PriceUpdated(uint timeUpdated);
    
    // To core smart contract
    function getSupportedTokens() external returns (address[] tokenAddresses);
    function getPrices(address[] tokenAddresses) external returns (uint[] prices);
    function getPrice(address tokenAddress) external returns (uint);
    
    // TO Oracles. msg.sender is the address of that Oracle.
    function updatePrices(address[] tokenAddresses, uint[] prices) external returns (bool success);
}