pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";
import "./components/base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "./libs/ERC20Extended.sol";
import "./interfaces/ComponentListInterface.sol";
import "./libs/ERC20NoReturn.sol";
import "./interfaces/FeeChargerInterface.sol";


// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface, ComponentContainer, PausableToken {

    ERC20Extended internal constant ETH = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    ComponentListInterface internal componentList;
    bytes32 public constant MARKET = "MarketProvider";
    bytes32 public constant EXCHANGE = "ExchangeProvider";
    bytes32 public constant WITHDRAW = "WithdrawProvider";
    bytes32 public constant RISK = "RiskProvider";
    bytes32 public constant WHITELIST = "WhitelistProvider";
    bytes32 public constant FEE = "FeeProvider";
    bytes32 public constant REIMBURSABLE = "Reimbursable";
    bytes32 public constant REBALANCE = "RebalanceProvider";
    bytes32 public constant LOCK = "LockProvider";

    function initialize (address _componentList) internal {
        require(_componentList != 0x0);
        componentList = ComponentListInterface(_componentList);
    }

    function updateComponent(bytes32 _name) public onlyOwner returns (address) {
        // still latest.
        if (super.getComponentByName(_name) == componentList.getLatestComponent(_name)) {
            return super.getComponentByName(_name);
        }

        // changed.
        require(super.setComponent(_name, componentList.getLatestComponent(_name)));
        // approve if it's not Marketplace.
        if (keccak256(abi.encodePacked(_name)) != keccak256(abi.encodePacked(MARKET))) {
            approveComponent(_name);
        }

        // return latest address.
        return componentList.getLatestComponent(_name);
    }



    function approveComponent(bytes32 _name) internal {
        address componentAddress = getComponentByName(_name);
        ERC20NoReturn mot = ERC20NoReturn(FeeChargerInterface(componentAddress).MOT());
        mot.approve(componentAddress, 0);
        mot.approve(componentAddress, 2 ** 256 - 1);
    }

    function () public payable {

    }
}
