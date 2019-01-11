pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/IndexInterface.sol";
import "../../contracts/interfaces/implementations/OlympusExchangeInterface.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../contracts/interfaces/MarketplaceInterface.sol";
import "../../contracts/interfaces/RebalanceSwapInterface.sol";
import "../../contracts/interfaces/FeeChargerInterface.sol";

contract MockRebalanceSwapIndex is IndexInterface, MockDerivative {
    using SafeMath for uint256;

    uint[] public weights;
    modifier checkLength(ERC20Extended[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }

    RebalanceSwapInterface rebalanceProvider = RebalanceSwapInterface(0x0);
    OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(0x0);

    constructor (ERC20Extended[] _tokens, uint[] _weights, RebalanceSwapInterface _rebalanceProvider, OlympusExchangeInterface _exchangeProvider)
        checkLength(_tokens, _weights) public {
        for (uint i = 0; i < _tokens.length; i++) {
            tokens.push(address(_tokens[i]));
        }
        weights = _weights;
        rebalanceProvider = _rebalanceProvider;
        exchangeProvider = _exchangeProvider;
        supportRebalance = true;
    }

    function initialize() public {
        FeeChargerInterface(address(rebalanceProvider)).MOT().approve(address(rebalanceProvider), 0);
        FeeChargerInterface(address(rebalanceProvider)).MOT().approve(address(rebalanceProvider), 2 ** 256 - 1);
        FeeChargerInterface(address(exchangeProvider)).MOT().approve(address(exchangeProvider), 0);
        FeeChargerInterface(address(exchangeProvider)).MOT().approve(address(exchangeProvider), 2 ** 256 - 1);
    }

    function () public payable {

    }

    function buyToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate, bytes32 _exchangeId
        ) external payable returns(bool success){
        return exchangeProvider.buyToken.value(msg.value)(_token, _amount, _minimumRate, address(this), _exchangeId);
    }
    function buyTokens() external returns(bool) {
        return false; // Out of the scope of the Mock. Use Buy token for this purpose.
    }

    function sellToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate, bytes32 _exchangeId
        ) external returns(bool success){
        _token.approve(address(exchangeProvider), 0);
        _token.approve(address(exchangeProvider), _amount);
        return exchangeProvider.sellToken(_token, _amount, _minimumRate, address(this), _exchangeId);
    }

    function rebalance() public returns (bool success) {
        address[] memory srcTokens;
        uint[] memory srcAmounts;
        address[] memory destTokens;
        uint i;
        (srcTokens,destTokens,srcAmounts) = rebalanceProvider.rebalanceGetTokensToTrade(0);
        for (i = 0; i < srcTokens.length; i++) {
            ERC20Extended(srcTokens[i]).approve(address(exchangeProvider), 0);
            ERC20Extended(srcTokens[i]).approve(address(exchangeProvider), srcAmounts[i]);
            require(
                exchangeProvider.tokenExchange(ERC20Extended(srcTokens[i]),ERC20Extended(destTokens[i]),srcAmounts[i],0,address(this),""),
                "1"
            );
        }
        return true;
    }

    function getTokens() public view returns (address[] _tokens, uint[] _weights) {
        return (tokens, weights);
    }

    function getPrice() public view returns(uint) {
        //mock 1 eth to 1 token
        return 10 ** 18;
    }

    function getETHBalance() public view returns(uint) {
        return address(this).balance;
    }
}
