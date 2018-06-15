pragma solidity 0.4.24;

import "./Derivative.sol";
import "./interfaces/IndexInterface.sol";
import "./libs/ERC20.sol";
import "./libs/SimpleERC20Token.sol";
import "./libs/SafeMath.sol";

contract MockIndex is Derivative, IndexInterface, SimpleERC20Token {
    using SafeMath for uint256;

    uint[] public weights;
    bool public supportRebalance;
    uint  constant internal PRECISION = (10**18);

    modifier checkLength(ERC20[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }

    // this should be called until it returns true.
    function rebalance() public returns (bool success);

    constructor (uint _decimals, string _description, string _category, bool _rebalance, ERC20[] _tokens, uint[] _weights) checkLength(_tokens, _weights) public {

        totalSupply = 0;
        decimals = _decimals;
        description = _description;
        category = _category;
        status = DerivativeStatus.Active;
        version = "1.0";
        fundType = DerivativeType.Index;
        supportRebalance = _rebalance;

        tokens = _tokens;
        weights = _weights;
    }
    function() public payable {
        require(msg.value > 0);
        require(status == DerivativeStatus.Active);

        uint price = getPrice();
        uint mintAmount = msg.value.mul(price).mul(10 ** (decimals - 18)).div(PRECISION);
        
        balances[msg.sender].add(mintAmount);
    }

    function changeStatus(uint8 _statusId) public onlyOwner returns(bool) {

        if (DerivativeStatus(_statusId) == DerivativeStatus.Active || 
            DerivativeStatus(_statusId) == DerivativeStatus.Paused || 
            DerivativeStatus(_statusId) == DerivativeStatus.Closed) {

            status = DerivativeStatus(_statusId);
            return true;

        } else {
            revert();
            return false;
        }
    }

    function getPrice() public view returns(uint) {
        //mock 1 eth to 1 token
        return 10 ** 18;
    }
}
