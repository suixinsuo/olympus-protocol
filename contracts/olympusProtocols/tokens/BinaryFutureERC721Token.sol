pragma solidity 0.4.24;

import "./FutureERC721Token.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract BinaryFutureERC721Token is FutureERC721Token {
    using SafeMath for uint256;

    // (tokenId > period)
    mapping(uint => uint) public tokenPeriod; // The price when they buy the token
    // Owner -> time -> tokenId
    mapping(address => mapping( uint => uint)) public ownerPeriodToken; // The price when they buy the token

    constructor(string _name, string _symbol, int _tokenPosition)
     FutureERC721Token(_name, _symbol, _tokenPosition) public {
        ownerPeriodToken[0x0][0] = 0; // Initalized by default
    }


    function _mint( address _to, uint _deposit, uint _buyingPrice,uint _period) internal {
        super._mint(_to, _deposit, _buyingPrice);
        uint tokenId = tokenIdCounter.sub(1); // Latest one is -1

        tokenPeriod[tokenId] = _period;
        ownerPeriodToken[_to][_period] = tokenId;
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

    function increaseDeposit(uint _tokenId, uint _amount) onlyOwner external  {
        tokenDeposit[_tokenId] = tokenDeposit[_tokenId].add(_amount);
    }

    function getTokenPeriod(uint _tokenId) public view returns(uint) {
        return tokenPeriod[_tokenId];
    }
}
