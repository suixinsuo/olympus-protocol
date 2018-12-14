pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";
import "./components/base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "./libs/ERC20Extended.sol";
import "./interfaces/ComponentListInterface.sol";
import "./libs/ERC20NoReturn.sol";
import "./interfaces/FeeChargerInterface.sol";

// Abstract class that implements the common functions to all our derivatives
contract BaseDerivative is DerivativeInterface, ComponentContainer {

    ERC20Extended internal constant ETH = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    ComponentListInterface public componentList;
    bytes32 public constant MARKET = "MarketProvider";
    bytes32 public constant PRICE = "PriceProvider";
    bytes32 public constant EXCHANGE = "ExchangeProvider";
    bytes32 public constant WITHDRAW = "WithdrawProvider";
    bytes32 public constant REBALANCE = "RebalanceProvider";
    bytes32 public constant FEE = "FeeProvider";
    bytes32 public constant ORACLE = "ChainlinkOracle";
    bytes32 public constant LOCKER = "LockerProvider";
    bytes32 public constant REIMBURSABLE = "Reimbursable";
    bytes32 public constant STEP = "StepProvider";

    mapping(bytes32 => bool) internal excludedComponents;

    function _initialize (address _componentList) internal {
        require(_componentList != 0x0);
        componentList = ComponentListInterface(_componentList);
        excludedComponents[MARKET] = true;
        excludedComponents[STEP] = true;
        excludedComponents[LOCKER] = true;
        excludedComponents[ORACLE] = true;
    }


    function updateComponent(bytes32 _name) public onlyOwner returns (address) {
        // still latest.
        if (getComponentByName(_name) == componentList.getLatestComponent(_name)) {
            return getComponentByName(_name);
        }

        // changed.
        require(setComponent(_name, componentList.getLatestComponent(_name)));
        // approve if it's not included in excluded components.
        if(!excludedComponents[_name]) {
            approveComponent(_name);
        }
        return getComponentByName(_name);

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
