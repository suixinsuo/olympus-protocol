
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/RiskControlInterface.sol";
import "../../contracts/interfaces/FeeChargerInterface.sol";
import "../../contracts/interfaces/implementations/OlympusExchangeInterface.sol";


contract MockFeeChargerFund is MockDerivative  {

    RiskControlInterface public riskControl;
    OlympusExchangeInterface public exchange;

    constructor (RiskControlInterface _riskControl, OlympusExchangeInterface _exchange) public {
        riskControl = _riskControl;
        exchange = _exchange;
    }

    function initialize() public {
        FeeChargerInterface(address(riskControl)).MOT().approve(address(riskControl), 0);
        FeeChargerInterface(address(riskControl)).MOT().approve(address(riskControl), 2 ** 256 - 1);
        FeeChargerInterface(address(exchange)).MOT().approve(address(exchange), 0);
        FeeChargerInterface(address(exchange)).MOT().approve(address(exchange), 2 ** 256 - 1);
    }

    function () public payable {

    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) public returns(bool) {
        return riskControl.hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate);
    }

    function buyToken(ERC20Extended _token, uint _amount, uint _minimumRate) external payable returns(bool success){
        return exchange.buyToken.value(msg.value)(_token, _amount, _minimumRate, address(this), bytes32(0), 0x0);
    }

    function buyTokens(ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates) external payable returns(bool success) {
        return exchange.buyTokens.value(msg.value)(_tokens, _amounts, _minimumRates, address(this), 0x0);
    }

    function sellToken(ERC20Extended _token, uint _amount, uint _minimumRate) external returns(bool success) {
        _token.approve(address(exchange), 0);
        _token.approve(address(exchange), _amount);
        return exchange.sellToken(_token, _amount, _minimumRate, address(this), bytes32(0), 0x0);
      }

    function sellTokens(ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates) external returns(bool success) {
        for(uint i = 0; i < _tokens.length; i ++){
            _tokens[i].approve(address(exchange), 0);
            _tokens[i].approve(address(exchange), _amounts[i]);
        }
        return exchange.sellTokens(_tokens, _amounts, _minimumRates, address(this), bytes32(0));
    }

    event LogNumber(string _text, uint _number);
}

