pragma solidity ^0.4.24;

import "../../interfaces/TokenBrokenInterface.sol";
import "../../interfaces/MappeableDerivative.sol";

import "../../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract TokenBroken is TokenBrokenInterface {
    using SafeMath for uint256;

    uint constant public DENOMINATOR = 10000;
    string public name = "Token Broker Provider";
    string public description = "Provides a snapshot of the balance of a token when derivative is broken";
    string public category="TokenBroken";
    string public version="1.0";

    // sender -> token -> balance
    // mapping(address => mapping(address => uint[])) public _balances;

    function calculateBalanceByInvestor(ERC20Extended _token) external view returns(uint[]) {
        address[] memory _investors = MappeableDerivative(msg.sender).getActiveInvestors();
        uint[] memory _balances = new uint[](_investors.length);
        uint _tokenDecimals = _token.decimals();

        // Precision means already premultiploed by token deciamls, saving gas on the loop
        uint _totalSupplyPrecision = ERC20Extended(msg.sender).totalSupply().mul(_tokenDecimals);
        uint _tokenAmountPrecision = _token.balanceOf(address(msg.sender)).mul(_tokenDecimals);

        for (uint i = 0; i < _investors.length; i++) {
          // (derivative/totalSupply) * tokenAmount) --> ( derivativeAmount * amount / totalSupply)
          _balances[i] = ERC20Extended(msg.sender)
            .balanceOf(_investors[i])
            .mul(_tokenAmountPrecision)
            .div(_totalSupplyPrecision);
        }

        return _balances;
    }



}

