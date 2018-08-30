pragma solidity 0.4.24;

import "./DerivativeInterface.sol";
import "./PriceInterface.sol";


contract IndexInterface is DerivativeInterface,  ERC20PriceInterface {

    address[] public tokens;
    uint[] public weights;
    bool public supportRebalance;


    function invest() public payable returns(bool success);
    function getPrice() public view returns(uint);

    // this should be called until it returns true.
    function rebalance() public returns (bool success);
    function getTokens() public view returns (address[] _tokens, uint[] _weights);
    function buyTokens() external returns(bool);
}
