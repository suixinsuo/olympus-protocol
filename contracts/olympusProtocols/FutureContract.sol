pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/FutureInterface.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/WhitelistInterface.sol";
import "../interfaces/RiskControlInterface.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";


contract FutureContract is FutureInterface, Ownable, ComponentContainerInterface {

    uint public constant DENOMINATOR = 10000;

    ERC721Token public longToken;
    ERC721Token public shortToken;
    ComponentListInterface public componentList;

    string public name = "Olympus Future";
    string public description = "Olympus Future";


    bytes32 public constant MARKET = "MarketProvider";
    bytes32 public constant PRICE = "PriceProvider";
    bytes32 public constant RISK = "RiskProvider";
    bytes32 public constant WHITELIST = "WhitelistProvider";
    bytes32 public constant FEE = "FeeProvider";
    bytes32 public constant REIMBURSABLE = "Reimbursable";
    bytes32 public constant STEP = "StepProvider";
    bytes32 public constant LOCKER = "LockerProvider";

    mapping(bytes32 => bool) internal excludedComponents;
    enum WhitelistKeys { Investment, Maintenance, Admin }

    enum FutureDirection {
        Long,
        Short
    }

  // If whitelist is disabled, that will become onlyOwner
  modifier onlyOwnerOrWhitelisted(WhitelistKeys _key) {
        WhitelistInterface whitelist = WhitelistInterface(getComponentByName(WHITELIST));
            require(msg.sender == owner || (whitelist.enabled(address(this), uint(_key)) && whitelist.isAllowed(uint(_key), msg.sender))
        );
        _;
  }

    // If whitelist is disabled, anyone can do this
    modifier whitelisted(WhitelistKeys _key) {
        require(WhitelistInterface(getComponentByName(WHITELIST)).isAllowed(uint(_key), msg.sender));
        _;
    }

    modifier withoutRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) {
        require(!hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate));
        _;
    }  

    function() public payable {
        revert();
    }    

    constructor(string _name, string _description) public {
        name = _name;
        description = _description;
    }

    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate) 
    public returns(bool) 
    {
        RiskControlInterface riskControl = RiskControlInterface(getComponentByName(RISK));
        bool risk = riskControl.hasRisk(_sender, _receiver, _tokenAddress, _amount, _rate);
        return risk;
    }  

    // constructor(string _name, string _description);
    function _initialize(
        address _componentList,
        uint8 _target, // an internal ID
        address _targetAddress, // if it’s ERC20, give it an address, otherwise 0x0
        uint _deliveryDate, // timestamp
        uint _depositPercentage, // 100 of 10000
        uint _amountOfTargetPerShare 
    ) public;
    // {
    //   require(_componentList != 0x0);
    //   componentList = ComponentListInterface(_componentList);    
    // }


    function invest(
        FutureDirection _direction, // long or short
        uint _shares // shares of the target.
    ) external payable returns (bool);

    //function addDeposit(uint8 _direction, uint8 _amounts) external payable returns (bool);
    //function closePosition(uint _shares) external returns (bool);

    // bot system
    function position() external returns (bool); // for bot.
    function clear() external returns (bool);
    function updateTargetPrice(uint _rateToEther) external returns(bool);

    // helpers
    function getTotalAssetValue(uint _direction) external view returns (uint);
    function getMyAssetValue(uint8 _direction) external view returns (uint); // in ETH
}
