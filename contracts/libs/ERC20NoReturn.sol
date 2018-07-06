pragma solidity 0.4.24;

contract ERC20NoReturn {
    uint256 public decimals;
    string public name;
    string public symbol;
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public;
    function approve(address spender, uint tokens) public;
    function transferFrom(address from, address to, uint tokens) public;

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}
