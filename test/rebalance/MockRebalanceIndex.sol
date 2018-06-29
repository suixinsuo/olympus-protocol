pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/IndexInterface.sol";
import "../../contracts/interfaces/implementations/OlympusExchangeInterface.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../contracts/interfaces/MarketplaceInterface.sol";
import "../../contracts/interfaces/RebalanceInterface.sol";

contract MockRebalanceIndex is IndexInterface, MockDerivative {
    using SafeMath for uint256;

    uint[] public weights;
    modifier checkLength(ERC20Extended[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }

    RebalanceInterface rebalanceProvider = RebalanceInterface(0x0);
    OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(0x0);

    constructor (ERC20Extended[] _tokens, uint[] _weights, RebalanceInterface _rebalanceProvider, OlympusExchangeInterface _exchangeProvider)
        checkLength(_tokens, _weights) public {
        for (uint i = 0; i < _tokens.length; i++) {
            tokens.push(address(_tokens[i]));
        }
        weights = _weights;
        rebalanceProvider = _rebalanceProvider;
        exchangeProvider = _exchangeProvider;
        supportRebalance = true;
    }

    function () public payable {

    }

    function buyToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate, bytes32 _exchangeId, address _partnerId
        ) external payable returns(bool success){
          return exchangeProvider.buyToken.value(msg.value)(_token, _amount, _minimumRate, address(this), _exchangeId, _partnerId);
        }


    function sellToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate, bytes32 _exchangeId, address _partnerId
        ) external returns(bool success){
            _token.approve(address(exchangeProvider), _amount);
          return exchangeProvider.sellToken(_token, _amount, _minimumRate, address(this), _exchangeId, _partnerId);
        }    

    function rebalance() public returns (bool success) {
        address[] memory tokensToSell;
        uint[] memory amountsToSell;
        address[] memory tokensToBuy;
        uint[] memory amountsToBuy;
        uint i;
        uint ETHBalanceBefore = address(this).balance;
        (tokensToSell,amountsToSell,tokensToBuy,amountsToBuy,) = rebalanceProvider.rebalanceGetTokensToSellAndBuy();
        for (i = 0; i < tokensToSell.length; i++) {
            ERC20Extended(tokensToSell[i]).approve(address(exchangeProvider), amountsToSell[i]);
            require(exchangeProvider.sellToken(ERC20Extended(tokensToSell[i]),amountsToSell[i],0,address(this),"",0x0));
        }
        amountsToBuy = rebalanceProvider.recalculateTokensToBuyAfterSale(address(this).balance - ETHBalanceBefore, amountsToBuy);
        for (i = 0; i < tokensToBuy.length; i++) {
            require(exchangeProvider.buyToken.value(amountsToBuy[i])(ERC20Extended(tokensToBuy[i]),amountsToBuy[i],0,address(this),"",0x0));
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
}
