pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";
import "./components/base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "./libs/ERC20Extended.sol";
import "./interfaces/ComponentListInterface.sol";
import "./libs/ERC20NoReturn.sol";
import "./interfaces/FeeChargerInterface.sol";
import "./interfaces/WhitelistInterface.sol";
import "./interfaces/RiskControlInterface.sol";
import "./interfaces/LockerInterface.sol";
import "./interfaces/StepInterface.sol";
import "./libs/ERC20Extended.sol";



// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface, ERC20Extended, ComponentContainer, PausableToken {

    ERC20Extended internal constant ETH = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    ComponentListInterface public componentList;
    bytes32 public constant MARKET = "MarketProvider";
    bytes32 public constant PRICE = "PriceProvider";
    bytes32 public constant EXCHANGE = "ExchangeProvider";
    bytes32 public constant WITHDRAW = "WithdrawProvider";
    bytes32 public constant WHITELIST = "WhitelistProvider";
    bytes32 public constant FEE = "FeeProvider";
    bytes32 public constant REIMBURSABLE = "Reimbursable";
    bytes32 public constant REBALANCE = "RebalanceProvider";
    bytes32 public constant STEP = "StepProvider";
    bytes32 public constant LOCKER = "LockerProvider";

    bytes32 public constant GETETH = "GetEth";

    uint public pausedTime;
    uint public pausedCycle;

    function pause() onlyOwner whenNotPaused public {
        paused = true;
        pausedTime = now;
    }

    enum WhitelistKeys { Investment, Maintenance, Admin }

    mapping(bytes32 => bool) internal excludedComponents;

    modifier OnlyOwnerOrPausedTimeout() {
        require( (msg.sender == owner) || ( paused == true && (pausedTime+pausedCycle) <= now ) );
        _;
    }

    // If whitelist is disabled, that will become onlyOwner
    modifier onlyOwnerOrWhitelisted(WhitelistKeys _key) {
        WhitelistInterface whitelist = WhitelistInterface(getComponentByName(WHITELIST));
        require(
            msg.sender == owner ||
            (whitelist.enabled(address(this), uint(_key)) && whitelist.isAllowed(uint(_key), msg.sender) )
        );
        _;
    }

    // If whitelist is disabled, anyone can do this
    modifier whitelisted(WhitelistKeys _key) {
        require(WhitelistInterface(getComponentByName(WHITELIST)).isAllowed(uint(_key), msg.sender));
        _;
    }

    function _initialize (address _componentList) internal {
        require(_componentList != 0x0);
        componentList = ComponentListInterface(_componentList);
        excludedComponents[MARKET] = true;
        excludedComponents[STEP] = true;
        excludedComponents[LOCKER] = true;
    }

    function updateComponent(bytes32 _name) public onlyOwner returns (address) {
        // still latest.
        if (super.getComponentByName(_name) == componentList.getLatestComponent(_name)) {
            return super.getComponentByName(_name);
        }
        // Changed.
        require(super.setComponent(_name, componentList.getLatestComponent(_name)));
        // Check if approval is required
        if(!excludedComponents[_name]) {
            approveComponent(_name);
        }
        return super.getComponentByName(_name);
    }

    function approveComponent(bytes32 _name) internal {
        address componentAddress = getComponentByName(_name);
        ERC20NoReturn mot = ERC20NoReturn(FeeChargerInterface(componentAddress).MOT());
        mot.approve(componentAddress, 0);
        mot.approve(componentAddress, 2 ** 256 - 1);
    }

    function () public payable {

    }

    function setMultipleTimeIntervals(bytes32[] _timerNames, uint[] _secondsList) public onlyOwner{
        LockerInterface(getComponentByName(LOCKER)).setMultipleTimeIntervals(_timerNames,  _secondsList);
    }

    function setMaxSteps( bytes32 _category,uint _maxSteps) public onlyOwner {
        StepInterface(getComponentByName(STEP)).setMaxCalls(_category,  _maxSteps);
    }
}
