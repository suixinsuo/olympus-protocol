pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";


// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface {
    uint256 public decimals;
    uint256 public totalSupply = 0;
    string public name;
    string public symbol;

    // ----------- ERC20 ----------
    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);

    function totalSupply() external view returns (uint supply) {
        return totalSupply;
    }

    function decimals() external view returns (uint) {
        return decimals;
    }


    function balanceOf(address tokenOwner) external view returns (uint balance) {
        return balances[tokenOwner];
    }

    function transfer(address to, uint tokens) public returns (bool success) {
        balances[msg.sender] = balances[msg.sender] - tokens;
        balances[to] = balances[to] + tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function transferFrom(address from, address to, uint tokens) external returns (bool success) {
        balances[from] = balances[from] - tokens;
        allowed[from][msg.sender] = allowed[from][msg.sender] - tokens;
        balances[to] = balances[to] + tokens;
        emit Transfer(from, to, tokens);
        return true;
    }

    function approve(address spender, uint tokens) external returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    function allowance(address tokenOwner, address spender) external view returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }
}
