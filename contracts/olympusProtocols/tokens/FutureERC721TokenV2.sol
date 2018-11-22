pragma solidity 0.4.24;

import "../../interfaces/FutureERC721.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract FutureERC721TokenV2 is ERC721Token, Ownable, FutureERC721 {
    using SafeMath for uint256;

    uint tokenIdCounter = 0;

    // (tokenId > future data)
    mapping(uint => uint) public tokenBuyingTime; // The price when they buy the token
    mapping(uint => uint) public tokenDeposit; // Their actual deposit
    mapping(uint => bool) public tokenValid; // Is valid or not (A token can be invalidated on a check position or after clear)
    mapping(uint => bool) public tokenPosition; // Is long or short (Long for true, short for false.)


    constructor(string _name, string _symbol) ERC721Token(_name, _symbol) public {

    }

    function _setFutureData(uint _tokenId, uint _deposit,bool _tokenPosition) internal {
        tokenBuyingTime[_tokenId] = now;
        tokenDeposit[_tokenId] = _deposit;
        tokenValid[_tokenId] = true;
        tokenPosition[_tokenId] = _tokenPosition;
    }

    function _mint(
        address _to,
        uint _deposit,
        bool _tokenPosition
    ) internal {
        require(_to != 0x0, "Can't mint to the empty address");
        require(_deposit > 0, "Deposit and initial price can't be zero");
        super._mint(_to, tokenIdCounter);
        _setFutureData(tokenIdCounter, _deposit, _tokenPosition);
        tokenIdCounter = tokenIdCounter.add(1);
    }

    function mint(
        address _to,
        uint _deposit,
        bool _tokenPosition
    ) external onlyOwner returns (bool) {
        _mint(_to,_deposit,_tokenPosition);
        return true;
    }

    function mintMultiple(
        address _to,
        uint _deposit,
        bool _tokenPosition,
        uint _total
    ) external onlyOwner returns(bool) {
        for(uint i = 0; i < _total; i++){
            _mint(_to,_deposit,_tokenPosition);
        }
        return true;
    }

    function invalidateToken(uint _tokenId) external onlyOwner {
        tokenValid[_tokenId] = false;
    }

    function invalidateTokens(uint[] _tokens) external onlyOwner {
        for(uint i = 0; i < _tokens.length; i++){
            tokenValid[_tokens[i]] = false;
        }
    }

    function isTokenValid(uint _tokenId) external view returns (bool _tokenValid) {
        return tokenValid[_tokenId];
    }

    function getBuyingTime(uint _tokenId) external view returns (uint _buyingPrice){
        return tokenBuyingTime[_tokenId];
    }

    function getDeposit(uint _tokenId) external view returns (uint _deposit){
        return tokenDeposit[_tokenId];
    }

    function getTokenPosition(uint _tokenId) external view returns (bool _tokenPosition){
        return tokenPosition[_tokenId];
    }

    function getTokenIdsByOwner(address _owner) external view returns (uint[] _tokenIds){
        return ownedTokens[_owner];
    }

    function getValidTokenIdsByOwner(address _owner) external view returns (uint[] _tokenIds){
        return getValidTokensList(ownedTokens[_owner]);
    }

    function getValidTokens() external view returns(uint[] memory) {
        return getValidTokensList(allTokens);
    }

    function getValidTokensList(uint[] _tokens) internal view returns(uint[] memory _validTokens ) {
        uint _length = 0;
        uint i;

        for(i = 0; i < _tokens.length; i++) {
            if(tokenValid[_tokens[i]]) { _length++; }
        }

        _validTokens = new uint[](_length);
        uint _counter = 0;

        for(i = 0; i < _tokens.length; i++) {
            if(tokenValid[_tokens[i]]) {
                _validTokens[_counter] = _tokens[i];
                _counter++;
            }
        }

        return _validTokens;
    }
}
