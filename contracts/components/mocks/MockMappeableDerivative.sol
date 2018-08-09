pragma solidity 0.4.24;

import "./MockDerivative.sol";
import "../../interfaces/MappeableDerivative.sol";

contract MockMappeableDerivative is MockDerivative , MappeableDerivative {


    // ------------  MAPPEABLE (Copy this section in your derivative) ------------

    mapping (address => uint) activeInvestorIndex; // Starts from 1 (0 is not existing)
    address[] activeInvestors; // Start in 0

    function addInvestor(address investor) internal {
       if (activeInvestorIndex[investor] == 0) {
        uint index = activeInvestors.push(investor);
        activeInvestorIndex[investor] = index;
      }
    }

    function removeInvestor(address investor) internal {

      if (balances[investor] > 0) {return;}

      // activeInvestorIndex starts in 1. We iterate until one before the last
      for (uint i = activeInvestorIndex[investor] - 1; i + 1 < activeInvestors.length; i++) {
        activeInvestors[i] = activeInvestors[i+1];
        activeInvestorIndex[activeInvestors[i+1]] -= 1;
      }
      activeInvestorIndex[investor] = 0; // Removed
      activeInvestors.length -= 1;
    }

    function getActiveInvestors() external view returns(address[]) {
      return activeInvestors;
    }

    // ------------  DERIVATIVE  (How to use Mappeable) ------------
    function invest() public payable returns(bool success) {

      // Map investor
      addInvestor(msg.sender);

      balances[msg.sender] = msg.value;
      totalSupply_ += msg.value;
      return true;
    }

    function requestWithdraw(uint _amount) external {
        require(balances[msg.sender] >= _amount);



        msg.sender.transfer(_amount); // Mock up, price is constant
        balances[msg.sender] -= _amount;
        totalSupply_ -= _amount;

        // Unmap investor
        removeInvestor(msg.sender);

    }
    // Out of scope
    function getPrice() public view returns(uint) { return 10**decimals; }


}
