pragma solidity ^0.4.18;

import "../libs/Ownable.sol";
import "../libs/Provider.sol";


contract PriceProviderInterface is Provider {
    // For now, all price are ETH based.
    event PriceUpdated(uint timeUpdated);
    
    // To core smart contract
    function getSupportedTokens() external returns (address[] tokenAddresses);
    //function getPrices(address[] tokenAddresses) external returns (uint[] prices);
    function getPrice(address tokenAddresses) external returns (uint _prices);
    
    // TO Oracles. msg.sender is the address of that Oracle.
    function updatePrices(address tokenAddresses, bytes32[] _Exchanges,  uint[] _prices, uint _nonce) external returns (bool success);
}
