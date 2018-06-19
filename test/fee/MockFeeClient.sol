pragma solidity 0.4.24;


import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/ChargeableInterface.sol";

contract MockFeeClient is MockDerivative  {
    ChargeableInterface feeProvider;

    constructor (ChargeableInterface _feeProvider) public {
        feeProvider = _feeProvider;
    }

    function feeDenominator() external view returns(uint) {
        return feeProvider.DENOMINATOR();
    }

    function setFee(uint fee) external onlyOwner {
        feeProvider.setFeePercentage(fee);
    }

    function getFee() external onlyOwner returns(uint) {
        return feeProvider.getFeePercentage();
    }

    function invest() public payable returns(bool success) {
        uint fee = feeProvider.calculateFee(msg.sender, msg.value);
        balances[msg.sender] += msg.value - fee; // 1 ETH 1 Fund Token
        emit Transfer(msg.sender, address(this), msg.value);
        return true;
    }
}
