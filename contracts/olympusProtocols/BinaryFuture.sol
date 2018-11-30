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
    uint public investingPeriod; // In seconds

    // Information of the token, mapped by hour
    BinaryFutureERC721Token public longToken;
    BinaryFutureERC721Token public shortToken;
    mapping( uint => uint ) public winnersBalances;
    // Time period to price
    mapping( uint => uint ) public prices;

    // TODO: Change this event for real transfer to user holder OL-1369
    event DepositReturned(int _direction, uint _tokenId, uint amount);
    event Benefits(int _direction, address _holder, uint amount);


    constructor(
      string _name,
      string _description,
      string _symbol,
      bytes32 _category,
      address _targetAddress,
      uint _investingPeriod
     ) public {
        name = _name;
        description = _description;
        symbol = _symbol;
        category = _category;
        targetAddress = _targetAddress;
        investingPeriod = _investingPeriod;

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

    /// --------------------------------- PERIOD ---------------------------------
    function getPeriod(uint _seconds) public view returns(uint) {
        return _seconds / investingPeriod;
    }

    function getCurrentPeriod() public view returns(uint) {
        return getPeriod(now);
    }
    /// --------------------------------- END PERIOD ---------------------------------

    /// --------------------------------- PRICE ---------------------------------

    function getTargetPrice() public view returns(uint) {

        uint _decimals = ERC20NoReturn(targetAddress).decimals();
        uint _expectedRate;
         (_expectedRate, ) = PriceProviderInterface(getComponentByName(EXCHANGE))
            .getPrice(ETH, ERC20Extended(targetAddress), 10 ** _decimals, 0x0);
        return _expectedRate;
    }
    /// --------------------------------- END PRICE ---------------------------------

    /// --------------------------------- INVEST ---------------------------------
    function invest(int  _direction, uint _period) external payable returns (bool) {
        _invest(_direction, _period,getCurrentPeriod(), getTargetPrice());
    }

    function _invest(
        int  _direction, // long or short
        uint _period,
        uint _currentPeriod,
        uint _targetPrice
        ) internal returns (bool) {

        require(status == DerivativeStatus.Active,"3");
        require(_period == _currentPeriod, "7");

        // Last investment price will be use to calculate the price

        prices[_period] = _targetPrice;
        require(_targetPrice > 0, "4");
        // Check if token exists to increase the amount
        uint _tokenId = ownerPeriodToken(_direction, msg.sender, _period);
        if( _tokenId > 0) {
            increaseTokenDeposit(_direction,_tokenId, msg.value );
            return true;
        }
        // Create new token
        require(
          getToken(_direction).mint(
            msg.sender,
            msg.value,
            1,  // We dont store the buying price as is capture after period finishes
            _period
         ) == true, "6");

        return true;
    }
    /// --------------------------------- END INVEST ---------------------------------

    /// --------------------------------- CLEAR ---------------------------------

    // TODO
    function clear() external returns (bool) {
        return true;
    }
    /// --------------------------------- END CLEAR ---------------------------------

       // --------------------------------- TOKENS ---------------------------------
    function getToken(int _direction) public view returns(BinaryFutureERC721Token) {
        if(_direction == LONG) {return longToken; }
        if(_direction == SHORT) {return shortToken; }
        revert();
    }

    function isTokenValid(int _direction, uint _id) public view returns(bool) {
        return getToken(_direction).isTokenValid(_id);
    }

    function ownerOf(int _direction, uint _id) public view returns(address) {
        return getToken(_direction).ownerOf(_id);
    }

    function getTokenDeposit(int _direction, uint _id) public view returns(uint) {
        return getToken(_direction).getDeposit(_id);
    }

    function getValidTokens(int _direction) public view returns(uint[] memory) {
        return getToken(_direction).getValidTokens();
    }

    function getTokenIdsByOwner(int _direction, address _owner) internal view returns (uint[] memory) {
        return getToken(_direction).getTokenIdsByOwner(_owner);
    }

    function invalidateTokens(int _direction, uint[] memory _tokens) internal  {
        return getToken(_direction).invalidateTokens(_tokens);
    }

    function increaseTokenDeposit(int _direction,uint _tokenId, uint _amount) internal  {
        return getToken(_direction).increaseDeposit(_tokenId, _amount);
    }


    function getValidTokenIdsByOwner(int _direction, address _owner) internal view returns (uint[] memory) {
        return getToken(_direction).getValidTokenIdsByOwner(_owner);
    }

    function ownerPeriodToken(int _direction, address _owner, uint _period) internal view returns (uint) {
        return getToken(_direction).ownerPeriodToken(_owner, _period);
    }
    // --------------------------------- END TOKENS ---------------------------------

}
