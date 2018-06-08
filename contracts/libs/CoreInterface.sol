
pragma solidity ^0.4.23;
import "./ERC20.sol";
interface CoreInterface {
    function buyToken(bytes32 exchangeId, ERC20[] tokens, uint[] amounts, uint[] rates, address deposit) public payable returns (bool success);
    function sellToken(bytes32 exchangeId, ERC20[] tokens, uint[] amounts, uint[] rates, address deposit) public payable returns (bool success);
}