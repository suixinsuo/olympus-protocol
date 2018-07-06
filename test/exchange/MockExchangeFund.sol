
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/implementations/OlympusExchangeInterface.sol";
import "../../contracts/interfaces/FeeChargerInterface.sol";


contract MockExchangeFund is MockDerivative {
    OlympusExchangeInterface exchange;

    constructor (OlympusExchangeInterface _exchange) public {
        exchange = _exchange;
    }

 function initialize() public {
      FeeChargerInterface(address(exchange)).MOT().approve(address(exchange), 0);
      FeeChargerInterface(address(exchange)).MOT().approve(address(exchange), 2 ** 256 - 1);
    }
   function supportsTradingPair(address _srcAddress, address _destAddress, bytes32 _exchangeId)
        external view returns(bool supported){
          return exchange.supportsTradingPair(_srcAddress, _destAddress, _exchangeId);
        }

    function buyToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate,
        address _depositAddress, bytes32 _exchangeId, address _partnerId
        ) external payable returns(bool success){
          return exchange.buyToken.value(msg.value)(_token, _amount, _minimumRate, _depositAddress, _exchangeId, _partnerId);
        }


    function sellToken
        (
        ERC20Extended _token, uint _amount, uint _minimumRate, bytes32 _exchangeId, address _partnerId
        ) external returns(bool success){
            _token.approve(address(exchange), _amount);
          return exchange.sellToken(_token, _amount, _minimumRate, address(this), _exchangeId, _partnerId);
        }

    function buyTokens
        (
        ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates,
        address _depositAddress, bytes32 _exchangeId, address _partnerId
        ) external payable returns(bool success) {
            return exchange.buyTokens.value(msg.value)(_tokens, _amounts, _minimumRates, _depositAddress, _exchangeId, _partnerId);
        }


    function sellTokens
        (
        ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates, bytes32 _exchangeId, address _partnerId
        ) external returns(bool success){
            for (uint i=0; i< _tokens.length; i++) {
                _tokens[i].approve(address(exchange), _amounts[i]);
            }
            return exchange.sellTokens(_tokens, _amounts, _minimumRates, address(this), _exchangeId, _partnerId);
        }
}

