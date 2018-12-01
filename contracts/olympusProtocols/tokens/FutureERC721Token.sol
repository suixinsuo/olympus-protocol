pragma solidity 0.4.24;

import "../../interfaces/FutureERC721.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract FutureERC721Token is ERC721Token, Ownable, FutureERC721 {
    using SafeMath for uint256;

    uint tokenIdCounter = 1;
    int tokenPosition_;
    // (tokenId > future data)
    mapping(uint => uint) public tokenBuyingPrice; // The price when they buy the token
    mapping(uint => uint) public tokenDeposit; // Their actual deposit
    mapping(uint => bool) public tokenValid; // Is valid or not (A token can be invalidated on a check position or after clear)



    constructor(string _name, string _symbol, int _tokenPosition) ERC721Token(_name, _symbol) public {
        require(_tokenPosition == -1 || _tokenPosition == 1, "Position should be either short or long");
        tokenPosition_ = _tokenPosition;
    }

    function _setFutureData(uint _tokenId, uint _deposit, uint _buyingPrice) internal {
        tokenBuyingPrice[_tokenId] = _buyingPrice;
        tokenDeposit[_tokenId] = _deposit;
        tokenValid[_tokenId] = true;
    }

    function _mint(
        address _to,
        uint _deposit,
        uint _buyingPrice
    ) internal {
        require(_to != 0x0, "Can't mint to the empty address");
        require(_deposit > 0 && _buyingPrice > 0, "Deposit and initial price can't be zero");
        super._mint(_to, tokenIdCounter);
        _setFutureData(tokenIdCounter, _deposit, _buyingPrice);
        tokenIdCounter = tokenIdCounter.add(1);
    }

    function mint(
        address _to,
        uint _deposit,
        uint _buyingPrice
    ) external onlyOwner returns (bool) {
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

    function getBuyingPrice(uint _tokenId) external view returns (uint _buyingPrice){
        return tokenBuyingPrice[_tokenId];
    }

    function getDeposit(uint _tokenId) external view returns (uint _deposit){
        return tokenDeposit[_tokenId];
    }

    function tokenPosition() external view returns (int _tokenPosition){
        return tokenPosition_;
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
        return filterTokens(_tokens, filterValid);
    }

    // TODO: this and isTokenValid is the same code, one is internal
    // for the filter parametter, other is public as interface. Can we refactor?
    function filterValid(uint _tokenId) internal view returns(bool) {
        return tokenValid[_tokenId];
    }

    function filterTokens(
        uint[] _tokens,
        function (uint) internal view returns(bool) filter)
       internal view returns(uint[] memory _validTokens ) {
        uint _length = 0;
        uint i;

        for(i = 0; i < _tokens.length; i++) {
            if(filter(_tokens[i])) { _length++; }
        }

        _validTokens = new uint[](_length);
        uint _counter = 0;

        for(i = 0; i < _tokens.length; i++) {
            if(filter(_tokens[i])) {
                _validTokens[_counter] = _tokens[i];
                _counter++;
            }
        }

        return _validTokens;
    }
}
