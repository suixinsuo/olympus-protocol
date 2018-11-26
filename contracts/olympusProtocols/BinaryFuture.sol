pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/BinaryFutureInterface.sol";
import "../interfaces/PriceProviderInterface.sol";
import "../libs/ERC20Extended.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../interfaces/StepInterface.sol";
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
    enum CheckPositionPhases { Initial, LongTokens, ShortTokens }
    enum ClearPositionPhases { Initial, CalculateLoses, CalculateBenefits }

    // Action of the Future
    bytes32 public constant CHECK_POSITION = "CheckPosition";
    // Basic information that is override on creation
    string public name = "Olympus 2 Dimensions Future";
    string public description = "2 Dimensions future";
    string public version = "0.0-20181126";
    string public symbol;
    // Config on creation
    uint public depositPercentage;
    address public targetAddress;
    uint public amountOfTargetPerShare;
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
      address _targetAddress,
      uint _amountOfTargetPerShare,
      uint _depositPercentage
     ) public {
        name = _name;
        description = _description;
        symbol = _symbol;
        category = _category;
        targetAddress = _targetAddress;
        amountOfTargetPerShare = _amountOfTargetPerShare;
        depositPercentage = _depositPercentage;
         //
        status = DerivativeStatus.New;
        fundType = DerivativeType.Future;
    }
 /// --------------------------------- INITIALIZE ---------------------------------

    function initialize(address _componentList) public {

        require(status == DerivativeStatus.New, "1");

        _initialize(_componentList);
        bytes32[4] memory _names = [MARKET, REIMBURSABLE, STEP, EXCHANGE];

        for (uint i = 0; i < _names.length; i++) {
            updateComponent(_names[i]);
        }

        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        setMaxSteps(CHECK_POSITION, 10);

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
    function getDepositPercentage() external view returns (uint) {return depositPercentage; }// 100 of 10000
    function getAmountOfTargetPerShare() external view returns (uint) { return amountOfTargetPerShare;}
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

    // Return the value required to buy a share to a current price
    function calculateShareDeposit(uint _amountOfShares, uint _targetPrice) public view returns(uint) {
        return _amountOfShares
            .mul(amountOfTargetPerShare)
            .mul(_targetPrice)
            .mul(depositPercentage)
            .div(DENOMINATOR); // Based on the deposit
    }
    /// --------------------------------- END INVEST ---------------------------------
    /// --------------------------------- CLEAR ---------------------------------

    // for bot.
    function clear() external returns (bool) {
        return true;
    }
    /// --------------------------------- END CLEAR ---------------------------------

    /// --------------------------------- CONTRACTS CALLS   ---------------------------------
    // Rebalance
    function startGasCalculation() internal {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
    }

    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        msg.sender.transfer(reimbursedAmount);
    }

    // Step

    function initializeOrContinueStep(bytes32 category) internal returns(uint) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).initializeOrContinue(category);
    }

    function getStatusStep(bytes32 category) internal view returns(uint) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).getStatus(category);
    }

    function finalizeStep(bytes32 category) internal returns(bool) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).finalize(category);
    }

    function goNextStep(bytes32 category) internal returns(bool) {
        return StepInterface(ReimbursableInterface(getComponentByName(STEP))).goNextStep(category);
    }

    function updateStatusStep(bytes32 category) internal returns(uint) {
        return StepInterface(ReimbursableInterface(getComponentByName(STEP))).updateStatus(category);
    }

    function setMaxSteps( bytes32 _category,uint _maxSteps) public onlyOwner {
        StepInterface(getComponentByName(STEP)).setMaxCalls(_category,  _maxSteps);
    }

    /// --------------------------------- END CONTRACTS CALLS   ---------------------------------
    /// --------------------------------- ASSETS VALUE  ---------------------------------
    function getTotalAssetValue(int /*_direction*/) external view returns (uint) {
        return 0;
    }

    // in ETH
    function getMyAssetValue(int /*_direction*/) external view returns (uint){
        return 0;
    }
    /// --------------------------------- END ASSETS VALUE  ---------------------------------

}
