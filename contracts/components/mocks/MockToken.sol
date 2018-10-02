pragma solidity 0.4.24;

import "../../libs/ERC20Extended.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract MockToken is  ERC20Extended, StandardToken {
    constructor (
      string _name,
      string _symbol,
      uint _decimals,
      uint _supply
    ) public {

        name = _name;
        symbol = _symbol;
        decimals = _decimals; // We dont restrict the decimals, so we can execute stress cases
        balances[msg.sender] = _supply;
        totalSupply_ = _supply;

    }

}
