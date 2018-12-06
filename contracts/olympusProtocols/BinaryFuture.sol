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
    uint public constant MAX_INVESTORS = 50;

    uint public constant MIN_REWARDS = 10**16;
    uint public constant MAX_REWARDS = 10**17;
    uint public constant REWARDS_PERCENTAGE = 100; //1%


    // Enum and constants
    int public constant LONG = -1;
    int public constant SHORT = 1;
    enum ClearPositionPhases { Initial, CalculateLoses, CalculateBenefits }

    // Basic information that is override on creation
    string public name = "Olympus Binary Future";
    string public description = "Binary future";
    string public version = "0.0-20181126";
    string public symbol;
    // Config on creation
    address public targetAddress;
    uint public investingPeriod; // In seconds

    // Information of the token, mapped by hour
    BinaryFutureERC721Token public longToken;
    BinaryFutureERC721Token public shortToken;
    uint public futureOwnBalance; // No winners, lost balance
    // Winners calculations
    // Period => value
    mapping( uint => uint ) public winnersBalances;
    mapping( uint => uint ) public winnersBalancesRedeemed;
    mapping( uint => uint ) public winnersInvestment; // Investment of the winner side, calculate winner ratio

    // period => cleard true or false
    mapping(uint => bool) public  tokensCleared;
    // Time period to price
    mapping(uint => uint ) public prices;
    // Redeem variable
    mapping(address => uint) public userRedeemBalance;

    event DepositReturned(int _direction, uint _period, address _holder, uint _amount);
    event Benefits(int _direction, uint _period, address _holder, uint _amount);
    event CallerRewarded(uint _amount, address _to);


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
        require(_period == _currentPeriod, "5");
        require(msg.value > 0, "13");
        require(
            getSupplyByPeriod(LONG, _period).add(getSupplyByPeriod(SHORT, _period)) < MAX_INVESTORS,
            "11"
        );
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
            // We dont store the buying price as is capture after period finishes
            getToken(_direction).mint(msg.sender, msg.value, 1, _period) == true,
            "6"
        );

        return true;
    }
    /// --------------------------------- END INVEST ---------------------------------

    /// ---------------------------------  TOKENS ---------------------------------
    // This will check all the tokens and execute the function passed as parametter
    function checkTokens(
        int _direction,
        uint _period,
        function (int, uint, uint) internal returns(bool) checkFunction
    ) internal returns (bool) {
        uint[] memory _tokens = getTokensByPeriod(_direction, _period);
        for (uint i = 0; i < _tokens.length; i++) {
            checkFunction(_direction, _period, _tokens[i]);
        }
        return true;
    }

    /// ---------------------------------  END TOKENS ---------------------------------


    /// --------------------------------- CLEAR ---------------------------------
    function clear(uint _period) external returns (bool) {
        return _clear(_period, getTargetPrice());
    }


    function _clear(uint _period, uint _currentPrice) internal returns (bool) {

        // CHECKS
        require(_period < getCurrentPeriod() - 1, "7"); // 3 to 4 pm cant withdraw after 5pm
        require(tokensCleared[_period] == false, "8"); // Cant clear twice
        // Clear has to hold a token. We also make sure period without tokens get cleared.
        require(
            ownerPeriodToken(LONG, msg.sender, _period) > 0
            || ownerPeriodToken(SHORT, msg.sender, _period) > 0,
            "10"
        );

        require(_currentPrice > 0, "9");

        // Special scenario: no losers
        if (_currentPrice == prices[_period]) {
            checkTokens(LONG, _period, returnDeposit);
            checkTokens(SHORT, _period, returnDeposit);
            finishClear(_period);
            return false;
        }

        // INITIALIZE
        int _winnerDirection = _currentPrice > prices[_period] ? LONG : SHORT;
        int _loserDirection = _currentPrice > prices[_period] ? SHORT : LONG;


        // RUN
        // Get losers balance that will be shared to the winners
        checkTokens(_loserDirection, _period, checkLosersOnClear);

        // whoever calls to this the first time gets rewarded.
        rewardCaller(_period);

        // Get winners total investment to calculate benefits ratio
        checkTokens(_winnerDirection, _period, calculateWinnersRatio);
        // Share the benefits to the winners
        checkTokens(_winnerDirection, _period, checkWinnersOnClear);

        // FINALIZE
        // Special scenario, no winners. TODO: what to do with it?
        if(winnersBalancesRedeemed[_period] == 0) {
            futureOwnBalance = winnersBalances[_period];
        }
        finishClear(_period);
        // TODO: reimburse to the executor
        return true;
    }

    function rewardCaller(uint _period) internal returns(bool) {
        if (winnersBalances[_period] == 0) { return false; }
        uint rewards = winnersBalances[_period] * REWARDS_PERCENTAGE / DENOMINATOR;
        if (rewards < MIN_REWARDS) { rewards = MIN_REWARDS;}
        if (rewards > MAX_REWARDS) { rewards = MAX_REWARDS;}
        winnersBalances[_period] = winnersBalances[_period].sub(rewards);
        msg.sender.transfer(rewards);
        emit CallerRewarded(rewards, msg.sender);
        return true;
    }

    function checkLosersOnClear(int _direction, uint _period, uint _id)  internal returns(bool) {
        if(!isTokenValid(_direction, _id)) {return false;} // Should not happen in binnary

        uint _tokenDeposit = getTokenDeposit(_direction, _id);
        invalidateToken(_direction, _id);
        winnersBalances[_period] = winnersBalances[_period].add(_tokenDeposit);

        return true;
    }

     // We check token by token, but in one go with process all tokens of the same holder
    function returnDeposit(int _direction, uint _period, uint _id) internal returns(bool) {
        if(!isTokenValid(_direction, _id)) {return false;}  // Should not happen in binnary

        invalidateToken(_direction, _id);
        address _holder = ownerOf(_direction, _id);
        uint _tokenDeposit = getTokenDeposit(_direction, _id);
        userRedeemBalance[_holder] = userRedeemBalance[_holder].add(_tokenDeposit);
        emit DepositReturned(_direction, _period, _holder, _tokenDeposit);

        return false;
    }


    function calculateWinnersRatio(int _direction, uint _period, uint _id) internal returns(bool) {
        winnersInvestment[_period] = winnersInvestment[_period].add(getTokenDeposit(_direction, _id));
        return true;
    }

    // We check token by token, but in one go with process all tokens of the same holder
    function checkWinnersOnClear(int _direction, uint _period, uint _id) internal returns(bool) {
        if(!isTokenValid(_direction, _id)) {return false;}  // Should not happen in binnary


        address _holder = ownerOf(_direction, _id);
        invalidateToken(_direction, _id);
        uint _benefits = calculateBenefits(_direction,_period,_id);
        userRedeemBalance[_holder] = userRedeemBalance[_holder].add(_benefits);

        emit Benefits(_direction, _period, _holder, _benefits);

        return false;
    }

    function finishClear(uint _period) internal {
        tokensCleared[_period] = true;
    }

    function calculateBenefits( int _direction, uint _period, uint _id) internal  returns(uint) {

         // Calculate benefits
        uint _tokenDeposit = getTokenDeposit(_direction, _id);
        uint _totalWinners = getSupplyByPeriod(_direction, _period);

        // I invest 20% of winner side, get 20% of benefits
        uint _benefits = winnersBalances[_period]
            .mul(_tokenDeposit)
            .div(winnersInvestment[_period]);

        winnersBalancesRedeemed[_period] = winnersBalancesRedeemed[_period]
            .add(_benefits); // Keep track

        // Special cases decimals
        uint _pendingBalance = winnersBalances[_period].sub(winnersBalancesRedeemed[_period]);
        if(_pendingBalance > 0 && _pendingBalance < _totalWinners) {
            _benefits = _benefits.add(_pendingBalance);
        }

        return _tokenDeposit.add(_benefits);
    }
    /// --------------------------------- END CLEAR ---------------------------------

    /// --------------------------------- REDEEM ---------------------------------
    function redeem() external {
        require(userRedeemBalance[msg.sender] > 0);
        msg.sender.transfer(userRedeemBalance[msg.sender]);
        userRedeemBalance[msg.sender] = 0;
    }
    /// --------------------------------- REDEEM ---------------------------------

    // --------------------------------- TOKENS ---------------------------------
    function getToken(int _direction) public view returns(BinaryFutureERC721Token) {
        if(_direction == LONG) {return longToken; }
        if(_direction == SHORT) {return shortToken; }
        revert();
    }

    function isTokenValid(int _direction, uint _id) public view returns(bool) {
        return getToken(_direction).isTokenValid(_id);
    }

    function getTokenDeposit(int _direction, uint _id) public view returns(uint) {
        return getToken(_direction).getDeposit(_id);
    }

    function ownerOf(int _direction, uint _id) public view returns(address) {
        return getToken(_direction).ownerOf(_id);
    }

    function getTokensByPeriod(int _direction, uint _period) public view returns(uint[] memory) {
        return getToken(_direction).getTokensByPeriod(_period);
    }


    function getSupplyByPeriod(int _direction, uint _period) public view returns(uint) {
        return getToken(_direction).getSupplyByPeriod(_period);
    }

    function invalidateToken(int _direction, uint _id) internal  {
        return getToken(_direction).invalidateToken(_id);
    }

    function increaseTokenDeposit(int _direction,uint _tokenId, uint _amount) internal  {
        return getToken(_direction).increaseDeposit(_tokenId, _amount);
    }


    function ownerPeriodToken(int _direction, address _owner, uint _period) internal view returns (uint) {
        return getToken(_direction).ownerPeriodToken(_owner, _period);
    }
    // --------------------------------- END TOKENS ---------------------------------

}
