pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/FutureInterfaceV1.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/WhitelistInterface.sol";
import "../interfaces/RiskControlInterface.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";


contract FutureContract is FutureInterfaceV1, Ownable, ComponentContainerInterface {

    uint public constant DENOMINATOR = 10000;

    ERC721Token public longToken;
    ERC721Token public shortToken;
    ComponentListInterface public componentList;

    string public name = "Olympus Future";
    string public description = "Olympus Future";
    string public version = "Olympus Future";

    uint public target;
    address public targetAddress;    
    uint public deliveryDate;
    uint public depositPercentage;
    uint public amountOfTargetPerShare;

    bytes32 public constant MARKET = "MarketProvider";
    bytes32 public constant PRICE = "PriceProvider";
    bytes32 public constant FEE = "FeeProvider";
    bytes32 public constant REIMBURSABLE = "Reimbursable";


    mapping(bytes32 => bool) internal excludedComponents;

    enum FutureDirection {
        Long,
        Short
    }

    function() public payable {
        revert();
    }    

    constructor(string _name, string _description, string _version) public {
        name = _name;
        description = _description;
        version = _version;
    }

    function _initialize(
        address _componentList
    ) public;

    function invest(
        FutureDirection _direction, // long or short
        uint _shares // shares of the target.
    ) external payable returns (bool);

    // bot system
    function checkPosition() external returns (bool); // for bot.
    function clear() external returns (bool);
    function updateTargetPrice(uint _rateToEther) external returns(bool);

    // helpers
    function getTotalAssetValue(uint _direction) external view returns (uint);
    function getMyAssetValue(uint8 _direction) external view returns (uint); // in ETH
}
