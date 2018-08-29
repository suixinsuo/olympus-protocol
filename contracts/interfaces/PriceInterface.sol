pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ComponentContainerInterface.sol";

contract ERC20PriceInterface {
    function getPrice() public view returns(uint);
}

contract ERC721PriceInterface {
    function getPrice(uint id) public view returns(uint);
}

