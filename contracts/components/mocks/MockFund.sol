pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/FundInterface.sol";

contract MockFund is FundInterface, MockDerivative {

    uint public totalSupply;
    mapping(address => uint) investors;

    address[] tokens;
    mapping(address => uint) amounts;
    mapping(address => bool) activeTokens;

    string public constant EXCHANGE = "Exchange";

    constructor(
      string _name,
      string _symbol,
      string _description,
      address exchangeAddress) public {
        name = _name;
        symbol = _symbol;
        description = _description;

        setComponent(EXCHANGE, exchangeAddress);
    }

    function updateTokens(ERC20[] _updatedTokens) internal returns(bool success) {
        ERC20 tokenAddress;
        for (uint i = 0; i < _updatedTokens.length; i++) {
            tokenAddress = _updatedTokens[i];
            // amounts[tokenAddress] = tokenAddress.balanceOf(this);
            amounts[tokenAddress] = 100000000000000000;
            if (amounts[tokenAddress] > 0 && !activeTokens[tokenAddress]) {
                tokens.push(tokenAddress);
                activeTokens[tokenAddress] = true;
                continue;
            }
        }
        return true;
    }



    function buyTokens(string  /*_exchangeId*/, ERC20[] _tokens, uint[] /*_amounts*/, uint[]  /*_rates*/) public onlyOwner returns(bool) {
        // uint sum = 0;
        // for (uint i = 0; i < _amounts.length; i++) {
        //     sum += _amounts[i];
        // }
        // // Check we have the ethAmount required
        // if (sum != ethAmount){ return false; }
        // ExchangeProvider exchange = ExchangeProvider(getComponentByName(EXCHANGE));
        // exchange.buyToken.value(ethAmount)(exchangeId, _tokens, _amounts, rates, address(this));
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(string /*_exchangeId*/, ERC20[] _tokens, uint[] _amounts, uint[]  /*_rates*/) public onlyOwner returns (bool) {
        for(uint i = 0; i < tokens.length; i++) {
            _tokens[i].approve(msg.sender, _amounts[i]);
        }
        // ExchangeProvider exchange = ExchangeProvider(getComponentByName(EXCHANGE));
        // exchange.buyToken.sellToken(exchangeId, _tokens, _amounts, rates, address(this));
        updateTokens(_tokens);
        return true;
    }

    function invest() public payable returns(bool) {
        balances[msg.sender] += msg.value; // 1 ETH 1 Fund Token
        totalSupply += msg.value;
        investors[msg.sender] += msg.value;
        emit Transfer(owner, msg.sender, msg.value);
        return true;
    }

    // Mock
    function requestWithdraw(uint amount) external {
        require(investors[msg.sender] >= amount);
        msg.sender.transfer(amount);
        investors[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(owner, msg.sender, amount);
    }

    // ------------------- OUT OF THE INTERFACE ----------------- ----
    function getTokens() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = amounts[tokens[i]];
        }
        return (tokens, _amounts);
    }

}
