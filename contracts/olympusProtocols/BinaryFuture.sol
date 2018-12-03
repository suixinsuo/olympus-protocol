pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/BinaryFutureInterface.sol";
import "../interfaces/PriceProviderInterface.sol";
import "../libs/ERC20Extended.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../BaseDerivative.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./tokens/BinaryFutureERC721Token.sol";


contract BinaryFuture is BaseDerivative, BinaryFutureInterface {

    using SafeMath for uint256;

    uint public constant DENOMINATOR = 10000;
    uint public constant TOKEN_DENOMINATOR = 10**18;

    // Enum and constants
    int public constant LONG = -1;
    int public constant SHORT = 1;
    enum ClearPositionPhases { Initial, CalculateLoses, CalculateBenefits }

    // Action of the Future
    bytes32 public constant CHECK_POSITION = "CheckPosition";
    // Basic information that is override on creation
    string public name = "Olympus 2 Dimensions Future";
    string public description = "2 Dimensions future";
    string public version = "0.0-20181126";
    string public symbol;
    // Config on creation
    address public targetAddress;
    // Information of the token, mapped by hour
    BinaryFutureERC721Token public longToken;
    BinaryFutureERC721Token public shortToken;
    mapping( uint => uint ) public winnersBalances;

    // TODO: Change this event for real transfer to user holder OL-1369
    event DepositReturned(int _direction, uint _tokenId, uint amount);
    event Benefits(int _direction, address _holder, uint amount);


    constructor(
      string _name,
      string _description,
      string _symbol,
      bytes32 _category,
      address _targetAddress
     ) public {
        name = _name;
        description = _description;
        symbol = _symbol;
        category = _category;
        targetAddress = _targetAddress;
         //
        status = DerivativeStatus.New;
        fundType = DerivativeType.Future;
    }
 /// --------------------------------- INITIALIZE ---------------------------------

    function initialize(address _componentList) public {

        require(status == DerivativeStatus.New, "1");

        _initialize(_componentList);
        bytes32[2] memory _names = [MARKET, EXCHANGE];

        for (uint i = 0; i < _names.length; i++) {
            updateComponent(_names[i]);
        }

        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();

        initializeTokens();
        status = DerivativeStatus.Active;
    }


    function initializeTokens() internal {
        longToken = new BinaryFutureERC721Token(name, symbol, LONG);
        shortToken = new BinaryFutureERC721Token(name, symbol, SHORT);
    }

    /// --------------------------------- END INITIALIZE ---------------------------------


    /// --------------------------------- GETTERS   ---------------------------------
    // This is fullfulling the interface
    function getName() external view returns (string) { return name; }
    function getDescription() external view returns (string) { return description; }
    function getTargetAddress() external view returns (address) { return targetAddress; } // if it’s ERC20, give it an address, otherwise 0x0
    function getLongToken() external view returns (ERC721) {return longToken; }
    function getShortToken() external view returns (ERC721) {return shortToken; }


    /// --------------------------------- END GETTERS   ---------------------------------

    /// --------------------------------- PRICE ---------------------------------
    function getTargetPrice() public view returns(uint) {
        uint _decimals = ERC20NoReturn(targetAddress).decimals();
        uint _expectedRate;
        // TODO: Ask which rate we need to return
        (_expectedRate, ) = PriceProviderInterface(getComponentByName(EXCHANGE))
            .getPrice(ETH, ERC20Extended(targetAddress), 10 ** _decimals, 0x0);
        return _expectedRate;
    }
    /// --------------------------------- END INVEST ---------------------------------

    /// --------------------------------- INVEST ---------------------------------
    function invest(
        int  /*_direction*/, // long or short
        uint  /*_shares*/ // shares of the target.
        ) external payable returns (bool) {

        require( status == DerivativeStatus.Active,"3");

        return true;
    }


    /// --------------------------------- END INVEST ---------------------------------
    /// --------------------------------- CLEAR ---------------------------------

    // TODO
    function clear() external returns (bool) {
        return true;
    }
    /// --------------------------------- END CLEAR ---------------------------------


}
