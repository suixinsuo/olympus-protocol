pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/IndexInterface.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/MarketplaceInterface.sol";

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

    // One time call
    function initialize(address _market, address /*_exchange*/, address /*_withdraw*/, address /*_risk*/, address /*_whitelist*/) onlyOwner external {
        // require(status == DerivativeStatus.New);
        MarketplaceInterface(_market).registerProduct();
        status = DerivativeStatus.Active;
    }

    function invest() public payable returns(bool success){
        require(status == DerivativeStatus.Active);
        require(msg.value > 0);

        uint price = getPrice();
        uint mintAmount = msg.value.mul(PRECISION).div(price).mul(10 ** (decimals - 18));

        balances[msg.sender] += balances[msg.sender].add(mintAmount);
        emit Invest(msg.sender, msg.value, price, mintAmount);
        return true;
    }
    function changeStatus(DerivativeStatus _statusId) public returns(bool) {
        require(status != DerivativeStatus.Closed);

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
    function rebalance() public returns (bool success) {
        return false;
    }
    function getPrice() public view returns(uint) {
        //mock 1 eth to 1 token
        return 10 ** 18;
    }
}
