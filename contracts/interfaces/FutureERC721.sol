pragma solidity 0.4.24;

interface FutureERC721 {
    function mint(
        address _to,
        uint _deposit,
        uint _buyingPrice
        ) external returns (bool); /* onlyOwner */

    function mintMultiple(
        address _to,
        uint _deposit,
        uint _buyingPrice,
        uint _total
        ) external returns (bool); /* onlyOwner */

    function invalidateToken(uint _tokenId) external; /* onlyOwner */

    function getBuyingPrice(uint _tokenId) external view returns (uint _buyingPrice);
    function getDeposit(uint _tokenId) external view returns (uint _deposit);
    function getTokenIdsByOwner(address _owner) external view returns (uint[] _tokenIds);
    function tokenPosition() external view returns (int _tokenPosition);
    function isTokenValid(uint _tokenId) external view returns (bool _tokenValid);

    function getValidTokens() external view returns(uint[] memory);
}
