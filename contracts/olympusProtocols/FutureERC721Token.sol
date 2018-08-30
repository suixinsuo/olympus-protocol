pragma solidity 0.4.24;

import "../interfaces/FutureERC721.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract FutureERC721Token is ERC721Token, Ownable, FutureERC721 {
    using SafeMath for uint256;

    uint tokenIdCounter = 0;
    uint tokenPosition_;
    // (tokenId > future data)
    mapping(uint => uint) public tokenBuyingPrice;
    mapping(uint => uint) public tokenDeposit;
    mapping(uint => bool) public tokenValid;


    constructor(string _name, string _symbol, uint _tokenPosition) ERC721Token(_name, _symbol) public {
        require(_tokenPosition == 0 || _tokenPosition == 1, "Position should be either short or long");
        tokenPosition_ = _tokenPosition;
    }

    function _setFutureData(uint _tokenId, uint _deposit, uint _buyingPrice) internal {
        tokenBuyingPrice[_tokenId] = _buyingPrice;
        tokenDeposit[_tokenId] = _deposit;
        tokenValid[_tokenId] = true;
    }

    function mint(
        address _to,
        uint _deposit,
        uint _buyingPrice
    ) external onlyOwner
    {
        require(_deposit > 0 && _buyingPrice > 0, "Deposit and initial price can't be zero");
        super._mint(_to, tokenIdCounter);
        _setFutureData(tokenIdCounter, _deposit, _buyingPrice);
        tokenIdCounter = tokenIdCounter.add(1);
    }

    function mintMultiple(
        address _to,
        uint[] _deposit,
        uint[] _buyingPrice
    ) external onlyOwner
    {
        for(uint i = 0; i < _deposit.length; i++){
            require(_deposit[i] > 0 && _buyingPrice[i] > 0, "Deposit and initial price can't be zero");
            super._mint(_to, tokenIdCounter);
            _setFutureData(tokenIdCounter, _deposit[i], _buyingPrice[i]);
            tokenIdCounter = tokenIdCounter.add(1);
        }
    }

    function invalidateToken(uint _tokenId) external onlyOwner {
        tokenValid[_tokenId] = false;
    }

    function isTokenValid(uint _tokenId) external view returns (bool _tokenValid) {
        return tokenValid[_tokenId];
    }

    function getBuyingPrice(uint _tokenId) external view returns (uint _buyingPrice){
        return tokenBuyingPrice[_tokenId];
    }

    function getDeposit(uint _tokenId) external view returns (uint _deposit){
        return tokenDeposit[_tokenId];
    }

    function tokenPosition() external view returns (uint _tokenPosition){
        return tokenPosition_;
    }

    function getTokenIdsByOwner(address _owner) external view returns (uint[] _tokenIds){
        return ownedTokens[_owner];
    }
}
