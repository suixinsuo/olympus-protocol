pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/WhiteListInterface.sol";

contract MockWhiteListClient is MockDerivative {

    uint8 public constant CATEGORY_BALANCE = 1;

    WhiteListInterface whiteListProvider;

    mapping (address => uint) public balances; // for testing the whitelist

    modifier onlyWhitelistedBalance {
        require(whiteListProvider.isAllowed(CATEGORY_BALANCE, msg.sender));
        _;
    }

    constructor (WhiteListInterface _whiteListProvider) public {
        whiteListProvider = _whiteListProvider;
    }

    function enableWhiteList() external onlyOwner returns(bool) {
        whiteListProvider.enable(CATEGORY_BALANCE);
        return true;
    }

    function disableWhiteList() external onlyOwner returns(bool) {
        whiteListProvider.disable(CATEGORY_BALANCE);
        return true;
    }

    function setAllowed(address[] accounts,  bool allowed) onlyOwner public returns(bool){
        whiteListProvider.setAllowed(accounts,CATEGORY_BALANCE, allowed);
        return true;
    }

    function updateBalance(uint amount) public  onlyWhitelistedBalance {
        balances[msg.sender] = amount;
    }

}
