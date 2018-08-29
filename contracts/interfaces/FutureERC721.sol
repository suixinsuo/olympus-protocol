pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract FutureERC721 is ERC721Token, Ownable {
    function mint(
        address _to,
        uint _position,
        uint _deposit,
        uint _buyingPrice
        ) public; /* onlyOwner */

    function mintMultiple(
        address _to,
        uint[] _position,
        uint[] _deposit,
        uint[] _buyingPrice
        ) public; /* onlyOwner */

    function getBuyingPrice(uint _tokenId) public view returns (uint _buyingPrice);
    function getDeposit(uint _tokenId) public view returns (uint _deposit);
    function getPosition(uint _tokenId) public view returns (uint _position);
}
