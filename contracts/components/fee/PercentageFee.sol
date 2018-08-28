pragma solidity 0.4.24;


import "../../interfaces/ChargeableInterface.sol";
import "../../interfaces/DerivativeInterface.sol";
import "../../components/base/FeeCharger.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract PercentageFee is ChargeableInterface, FeeCharger {
    using SafeMath for uint256;
    mapping(address => mapping(address => uint)) public fees; // owner => contract => fee value

    constructor () public {
        name = "PercentageFee";
        description = "Calculates the fee as percentage";
        category = "Fee";
        version = "1.0";
        DENOMINATOR = 10000;
    }

    function setFeePercentage(uint _fee) external returns(bool success) {
        require(_fee >= 0);
        require(_fee < DENOMINATOR);

        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        fees[derivative.owner()][msg.sender] = _fee;
        return true;
    }

    function getFeePercentage() external view returns (uint) {
        return fees[DerivativeInterface(msg.sender).owner()][msg.sender];
    }

    function calculateFee(address /*_caller*/,  uint _amount)  external returns(uint) {
        require(payFee(0));
        DerivativeInterface derivative = DerivativeInterface(msg.sender);
        if(fees[derivative.owner()][msg.sender] == 0) {
            return 0;
        }

        uint _fee = _amount.mul(fees[derivative.owner()][msg.sender]).div(DENOMINATOR);
        return _fee;
    }


}
