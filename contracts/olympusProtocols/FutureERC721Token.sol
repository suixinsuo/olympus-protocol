pragma solidity 0.4.24;

import "../interfaces/FutureERC721.sol";


contract FutureERC721Token is FutureERC721 {
    using SafeMath for uint256;

    uint tokenIdCounter = 0;

    // (tokenId > future data)
    mapping(uint => uint) public tokenPosition;
    mapping(uint => uint) public tokenBuyingPrice;
    mapping(uint => uint) public tokenDeposit;


    constructor(string _name, string _symbol) public {
    }

    function _setFutureData(uint _tokenId, uint _position, uint _deposit, uint _buyingPrice) internal {
        tokenPosition[_tokenId] = _position;
        tokenBuyingPrice[_tokenId] = _buyingPrice;
        tokenDeposit[_tokenId] = _deposit;
    }

    function mint(
        address _to,
        uint _position,
        uint _deposit,
        uint _buyingPrice
    ) public onlyOwner
    {
        super._mint(_to, tokenIdCounter);
        _setFutureData(tokenIdCounter, _position, _deposit, _buyingPrice);
        tokenIdCounter.add(1);
    }

    function mintMultiple(
        address _to,
        uint[] _position,
        uint[] _deposit,
        uint[] _buyingPrice
    ) public onlyOwner
    {
        for(uint i = 0; i < _position.length; i++){
            super._mint(_to, tokenIdCounter);
            _setFutureData(tokenIdCounter, _position[i], _deposit[i], _buyingPrice[i]);
            tokenIdCounter.add(1);
        }
    }

    function getBuyingPrice(uint _tokenId) public view returns (uint _buyingPrice){
        return tokenBuyingPrice[_tokenId];
    }

    function getDeposit(uint _tokenId) public view returns (uint _deposit){
        return tokenDeposit[_tokenId];
    }

    function getPosition(uint _tokenId) public view returns (uint _position){
        return tokenPosition[_tokenId];
    }
}
