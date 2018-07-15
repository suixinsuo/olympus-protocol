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


// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface, ComponentContainer, PausableToken {

    ERC20Extended internal constant ETH = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    ComponentListInterface internal componentList;
    string public constant MARKET = "MarketProvider";
    string public constant PRICE = "PriceProvider";
    string public constant EXCHANGE = "ExchangeProvider";
    string public constant WITHDRAW = "WithdrawProvider";
    string public constant RISK = "RiskProvider";
    string public constant WHITELIST = "WhitelistProvider";
    string public constant FEE = "FeeProvider";
    string public constant REIMBURSABLE = "Reimbursable";
    string public constant REBALANCE = "RebalanceProvider";
    string public constant LOCKER = "LockerProvider";

    enum WhitelistKeys { Investment, Maintenance }

    event  RiskEvent(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate, bool risky);

  // If whitelist is disabled, that will become onlyOwner
    modifier onlyOwnerOrWhitelisted(WhitelistKeys _key) {
      WhitelistInterface whitelist = WhitelistInterface(getComponentByName(WHITELIST));
      require(
          msg.sender == owner ||
          (whitelist.enabled(address(this), uint8(_key)) && whitelist.isAllowed( uint8(_key), msg.sender) )
      );
      _;
    }

    // If whitelist is disabled, anyone can do this
    modifier whitelisted(WhitelistKeys _key) {
        require(WhitelistInterface(getComponentByName(WHITELIST)).isAllowed(uint8(_key), msg.sender));
        _;
    }

    modifier withoutRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) {
        require(!hasRisk(_sender,_receiver,_tokenAddress, _amount, _rate));
        _;
    }

    function initialize (address _componentList) internal {
        require(_componentList != 0x0);
        componentList = ComponentListInterface(_componentList);
    }

    function updateComponent(string _name) public onlyOwner returns (address) {
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



    function approveComponent(string _name) internal {
        address componentAddress = getComponentByName(_name);
        ERC20NoReturn(FeeChargerInterface(componentAddress).MOT()).approve(componentAddress, 0);
        ERC20NoReturn(FeeChargerInterface(componentAddress).MOT()).approve(componentAddress, 2 ** 256 - 1);
    }

    function () public payable {

    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) public returns(bool) {
        RiskControlInterface riskControl = RiskControlInterface(getComponentByName(RISK));
        bool risk = riskControl.hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate);
        emit RiskEvent (_sender, _receiver, _tokenAddress, _amount, _rate, risk);
        return risk;
    }
}
