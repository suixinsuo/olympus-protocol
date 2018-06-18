pragma solidity ^0.4.18;

/**
 * @title Simple ERC20 Token
 *
 * @dev for mock only
 */
contract SimpleERC20Token {

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);

    uint public _tokenDecimals;
    uint public _totalSupply;

    // Balances for each account
    mapping(address => uint256) balances;

    // Owner of account approves the transfer of an amount to another account
    mapping(address => mapping (address => uint256)) allowed;

    constructor (uint _decimals) public {

        require(_decimals >= 0 && _decimals <= 18);
        if(_decimals == 0){
            _tokenDecimals = 18;
        }else{
            _tokenDecimals = _decimals;
        }
        // balances[msg.sender] = 2**256 - 1;
        balances[msg.sender] = 10 ** 9 * 10 ** 18;
        _totalSupply = balances[msg.sender];
    }

    function totalSupply() external view returns (uint supply) {
        return _totalSupply;
    }

    function decimals() external view returns (uint) {
        return _tokenDecimals;
    }

    // Get the token balance for account `tokenOwner`
    function balanceOf(address tokenOwner) external view returns (uint balance) {
        return balances[tokenOwner];
    }

    // Transfer the balance from owner's account to another account
    function transfer(address to, uint tokens) external returns (bool success) {
        balances[msg.sender] = balances[msg.sender] - tokens;
        balances[to] = balances[to] + tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    // Send `tokens` amount of tokens from address `from` to address `to`
    // The transferFrom method is used for a withdraw workflow, allowing contracts to send
    // tokens on your behalf, for example to "deposit" to a contract address and/or to charge
    // fees in sub-currencies; the command should fail unless the _from account has
    // deliberately authorized the sender of the message via some mechanism; we propose
    // these standardized APIs for approval:
    function transferFrom(address from, address to, uint tokens) external returns (bool success) {
        balances[from] = balances[from] - tokens;
        allowed[from][msg.sender] = allowed[from][msg.sender] - tokens;
        balances[to] = balances[to] + tokens;
        emit Transfer(from, to, tokens);
        return true;
    }

    // Allow `spender` to withdraw from your account, multiple times, up to the `tokens` amount.
    // If this function is called again it overwrites the current allowance with _value.
    function approve(address spender, uint tokens) external returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    function allowance(address tokenOwner, address spender) external view returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }
}
