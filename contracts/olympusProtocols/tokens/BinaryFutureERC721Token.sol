pragma solidity 0.4.24;

import "./FutureERC721Token.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract BinaryFutureERC721Token is FutureERC721Token {
    using SafeMath for uint256;

    uint tokenIdCounter = 0;

    // (tokenId > future data)
    mapping(uint => uint) public tokenBuyingTime; // The price when they buy the token

    constructor(string _name, string _symbol, int _tokenPosition)
     FutureERC721Token(_name, _symbol, _tokenPosition) public {
    }

    function _setBinaryData(uint _tokenId) internal {
        tokenBuyingTime[_tokenId] = now;
    }



    function _mint( address _to, uint _deposit, uint _buyingPrice) internal {
        uint tokenId = tokenIdCounter; // Will increase after mind
        super._mint(_to, _deposit, _buyingPrice);
        _setBinaryData(tokenId);
    }

    function mint(address _to, uint _deposit, uint _buyingPrice) external onlyOwner returns (bool) {
        _mint(_to,_deposit,_buyingPrice);
        return true;
    }

    function mintMultiple(
        address _to,
        uint _deposit,
        uint _buyingPrice,
        uint _total
    ) external onlyOwner returns(bool) {
        for(uint i = 0; i < _total; i++){
            _mint(_to,_deposit,_buyingPrice);
        }
        return true;
    }

}
