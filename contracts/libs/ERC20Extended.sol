pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ERC20Extended is ERC20 {
    function decimals() public view returns(uint digits);
}
