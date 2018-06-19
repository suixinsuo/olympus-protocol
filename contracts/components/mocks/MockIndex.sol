pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/IndexInterface.sol";
import "../../libs/SafeMath.sol";

contract MockIndex is IndexInterface, MockDerivative {
    using SafeMath for uint256;

    uint[] public weights;
    bool public isRebalance;
    uint  constant internal PRECISION = (10**18);
    event Invest(address _invester, uint _ethAmount, uint _rate, uint _mintAmount);

    modifier checkLength(ERC20[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }
    constructor (uint _decimals, string _description, string _category, bool _rebalance, ERC20[] _tokens, uint[] _weights) checkLength(_tokens, _weights) public {

        totalSupply = 0;
        decimals = _decimals;
        description = _description;
        category = _category;
        status = DerivativeStatus.Active;
        version = "1.0";
        fundType = DerivativeType.Index;
        isRebalance = _rebalance;

        tokens = _tokens;
        weights = _weights;
    }
    function invest() public payable returns(bool success){
        require(msg.value > 0);
        require(status == DerivativeStatus.Active);

        uint price = getPrice();
        uint mintAmount = msg.value.mul(price).mul(10 ** (decimals - 18)).div(PRECISION);

        balances[msg.sender] += balances[msg.sender].add(mintAmount);
        emit Invest(msg.sender, msg.value, price, mintAmount);
    }
    function changeStatus(DerivativeStatus _statusId) public returns(bool) {

        if (DerivativeStatus(_statusId) == DerivativeStatus.Active || 
            DerivativeStatus(_statusId) == DerivativeStatus.Paused || 
            DerivativeStatus(_statusId) == DerivativeStatus.Closed) {

            if (status == DerivativeStatus.Closed) {
                revert();
            } else {
                status = DerivativeStatus(_statusId);
            }
            return true;

        } else {
            revert();
            return false;
        }
    }
    function rebalance() public returns (bool success) {
        return false;
    }
    function getPrice() public view returns(uint) {
        //mock 1 eth to 1 token
        return 10 ** 18;
    }
}
