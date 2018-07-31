pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockDerivative.sol";
import "../../contracts/interfaces/WhitelistInterface.sol";
import "../../contracts/interfaces/FeeChargerInterface.sol";

import "../../contracts/interfaces/FeeChargerInterface.sol";

contract MockWhitelistClient is MockDerivative {

    uint public constant CATEGORY_BALANCE = 1;

    WhitelistInterface whitelistProvider;

    mapping (address => uint) public balances; // for testing the whitelist

    modifier onlyWhitelistedBalance {
        require(whitelistProvider.isAllowed(CATEGORY_BALANCE, msg.sender));
        _;
    }

    constructor (WhitelistInterface _whitelistProvider) public {
        whitelistProvider = _whitelistProvider;
    }

    function initialize() public {
        FeeChargerInterface(address(whitelistProvider)).MOT().approve(address(whitelistProvider), 0);
        FeeChargerInterface(address(whitelistProvider)).MOT().approve(address(whitelistProvider), 2 ** 256 - 1);
    }

    function enableWhitelist() external onlyOwner returns(bool) {
        whitelistProvider.enable(CATEGORY_BALANCE);
        return true;
    }

    function disableWhitelist() external onlyOwner returns(bool) {
        whitelistProvider.disable(CATEGORY_BALANCE);
        return true;
    }

    function setAllowed(address[] accounts,  bool allowed) onlyOwner public returns(bool){
        whitelistProvider.setAllowed(accounts,CATEGORY_BALANCE, allowed);
        return true;
    }

    function updateBalance(uint amount) public  onlyWhitelistedBalance {
        balances[msg.sender] = amount;
    }

}
