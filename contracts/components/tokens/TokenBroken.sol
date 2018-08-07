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

    // sender -> token -> balances length. When is 0 is redeemed and can be removed
    mapping(address => mapping(address  => uint) ) public balancePendingLength;
    // sender -> token -> user -> balances
    mapping(address => mapping(address  =>  mapping (address => uint))) public tokenBalances;
  
 
    function calculateBalanceByInvestor(ERC20Extended _token) external returns(uint[]) {
        require(balancePendingLength[msg.sender][address(_token)] == 0, "Token was not broken");
        require(_token.balanceOf(address(msg.sender)) > 0, "Derivative has this token" );

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
            tokenBalances[msg.sender][address(_token)][_investors[i]] =   _balances[i]; 
        }
        balancePendingLength[msg.sender][address(_token)] = _balances.length;

        return _balances;
    }

    // For single balance, you can query the public mapping. That support avoid several
    // calls for several balances
    function tokenBalancesOf(address [] _tokens, address _investor) external returns(uint[]){
        uint[] memory _tokenBrokenBalances = new uint[] (_tokens.length);
        uint i;
        for( i = 0; i < _tokenBrokenBalances.length; i++) {
            _tokenBrokenBalances[i] = tokenBalances[msg.sender][_tokens[i]][_investor];
        }
        return _tokenBrokenBalances;
    }

    // Once this function is called, the amount is reduced from the provider
    function withdraw(address _token, address _investor) external returns(uint) {
        require(tokenBalances[msg.sender][_token][_investor] > 0); 

        // reset the data
        balancePendingLength[msg.sender][_token] --;  
        tokenBalances[msg.sender][_token][_investor] = 0;
        return  balancePendingLength[msg.sender][_token];
    }



}

