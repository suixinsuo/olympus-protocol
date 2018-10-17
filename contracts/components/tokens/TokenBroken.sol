pragma solidity ^0.4.24;

import "../../interfaces/TokenBrokenInterface.sol";
import "../../interfaces/MappeableDerivative.sol";

import "../../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract TokenBroken is TokenBrokenInterface , Ownable {
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

        address[] memory _investors = MappeableDerivative(msg.sender).getActiveInvestors();
        uint[] memory _balances = new uint[](_investors.length);
        // 0 except in rebroken tokens
        uint pendingTransactions = balancePendingLength[msg.sender][address(_token)];
        // Precision means already premultiploed by token deciamls, saving gas on the loop
        uint _totalSupply = ERC20Extended(msg.sender).totalSupply();
        uint _tokenAmount = _token.balanceOf(address(msg.sender));

        for (uint i = 0; i < _investors.length; i++) {
            // The basic idea is get the %(derivative/totalSupply) of the fund holder, and
            // multiply per the total amount of token. Dividing at last provides result and avoid decimal issues.
            _balances[i] = ERC20Extended(msg.sender)
                .balanceOf(_investors[i])
                .mul(_tokenAmount)
                .div(_totalSupply);
            // In case the token was broken twice and not withdrawn, we dont increase the size of pending.
            if(tokenBalances[msg.sender][address(_token)][_investors[i]] == 0) {
                pendingTransactions++;
            }
            tokenBalances[msg.sender][address(_token)][_investors[i]] += _balances[i]; // Token can break
        }
        balancePendingLength[msg.sender][address(_token)] = pendingTransactions;

        return _balances;
    }

    function tokenBalanceOf(address _derivative, address _token, address _investor) external view returns(uint) {
        return tokenBalances[_derivative][_token][_investor];
    }

    // For single balance, you can query the public mapping. That support avoid several
    // calls for several balances
    function tokenBalancesOf(address[] _tokens, address _investor) external returns(uint[]) {
        uint[] memory _tokenBrokenBalances = new uint[] (_tokens.length);
        uint i;
        for( i = 0; i < _tokenBrokenBalances.length; i++) {
            _tokenBrokenBalances[i] = tokenBalances[msg.sender][_tokens[i]][_investor];
        }
        return _tokenBrokenBalances;
    }

    // Once this function is called, the amount is reduced from the provider
    function withdraw(address _token, address _investor) external returns(uint) {
        // reset the data
        balancePendingLength[msg.sender][_token] --;
        tokenBalances[msg.sender][_token][_investor] = 0;
        return  balancePendingLength[msg.sender][_token];
    }




}

