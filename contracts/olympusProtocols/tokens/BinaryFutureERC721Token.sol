pragma solidity 0.4.24;

import "./FutureERC721Token.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract BinaryFutureERC721Token is FutureERC721Token {
    using SafeMath for uint256;

    // (tokenId > future data)
    mapping(uint => uint) public tokenBuyingTime; // The price when they buy the token

    constructor(string _name, string _symbol, int _tokenPosition)
     FutureERC721Token(_name, _symbol, _tokenPosition) public {
    }


    function _mint( address _to, uint _deposit, uint _buyingPrice,uint _period) internal {
        uint tokenId = tokenIdCounter; // Will increase after mint
        super._mint(_to, _deposit, _buyingPrice);
        tokenBuyingTime[tokenId] = _period;
    }

    function mint(address _to, uint _deposit, uint _buyingPrice, uint _period) external onlyOwner returns (bool) {
        _mint(_to,_deposit,_buyingPrice, _period);
        return true;
    }

    function mintMultiple(
        address _to,
        uint _deposit,
        uint _buyingPrice,
        uint _period,
        uint _total
    ) external onlyOwner returns(bool) {
        for(uint i = 0; i < _total; i++){
            _mint(_to,_deposit,_buyingPrice, _period);
        }
        return true;
    }

}
