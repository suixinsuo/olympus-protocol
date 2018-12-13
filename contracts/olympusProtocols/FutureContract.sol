pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/FutureInterfaceV1.sol";
import "../interfaces/LockerInterface.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../interfaces/StepInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../BaseDerivative.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./tokens/FutureERC721Token.sol";
import "../interfaces/ChainlinkInterface.sol";


contract FutureContract is BaseDerivative, FutureInterfaceV1 {

    using SafeMath for uint256;

    uint public constant DENOMINATOR = 10000;
    uint public constant TOKEN_DENOMINATOR = 10**18;
    uint public constant INITIAL_FEE = 10**17;
    uint public constant MAX_TIMEOUT = 300;

    // Enum and constants
    int public constant LONG = -1;
    int public constant SHORT = 1;
    enum CheckPositionPhases { Initial, LongTokens, ShortTokens }
    enum ClearPositionPhases { Initial, CalculateLoses, CalculateBenefits }
    enum MutexStatus { AVAILABLE, CHECK_POSITION, CLEAR }

    MutexStatus public productStatus = MutexStatus.AVAILABLE;

    // Action of the Future
    bytes32 public constant CLEAR = "Clear";
    bytes32 public constant CHECK_POSITION = "CheckPosition";
    // Basic information that is override on creation
    string public name = "Olympus Future";
    string public description = "Olympus Future";
    string public version = "1.1-20181113";
    string public symbol;
    // Config on  Creation
    uint public target;
    address public targetAddress;
    uint public targetPrice;
    uint public deliveryDate;
    uint public depositPercentage;
    uint public forceClosePositionDelta;
    uint public amountOfTargetPerShare;
    // Information of the tokens and balance
    FutureERC721Token public longToken;
    FutureERC721Token public shortToken;
    uint public winnersBalance;
    // Manager balance for reiumursable
    uint public accumulatedFee;
    // Check position frozen data
    uint[] public frozenLongTokens;
    uint[] public frozenShortTokens;
    // TODO: Maybe struct will compact for optimizing (but will need getters)
    uint public frozenPrice; // Keep same price on clear and check position.
    uint public frozenTotalWinnersSupply; // To check the percentage of each winner
    uint public winnersBalanceRedeemed; // To check at the end decimals or not winers

    // TODO: Change this event for real transfer to user holder OL-1369

    event DepositReturned(int _direction, uint _tokenId, uint amount);
    event Benefits(int _direction, address _holder, uint amount);


    constructor(
      string _name,
      string _description,
      string _symbol,
      bytes32 _category,
      uint _target,
      address _targetAddress,
      uint _amountOfTargetPerShare,
      uint _depositPercentage,
      uint _forceClosePositionDelta
    ) public {
        name = _name;
        description = _description;
        symbol = _symbol;
        category = _category;
        target = _target;
        targetAddress = _targetAddress;
        amountOfTargetPerShare = _amountOfTargetPerShare;
        depositPercentage = _depositPercentage;
        forceClosePositionDelta = _forceClosePositionDelta;
        //
        status = DerivativeStatus.New;
        fundType = DerivativeType.Future;
    }


    /// --------------------------------- INITIALIZE ---------------------------------

    function initialize(address _componentList, uint _deliveryDate) public payable {

        require(status == DerivativeStatus.New, "1");
        // Require some balance for internal operations such as reimbursable
        require(msg.value >= INITIAL_FEE, "2");

        _initialize(_componentList);
        bytes32[5] memory _names = [MARKET, LOCKER, REIMBURSABLE, STEP,ORACLE];

        for (uint i = 0; i < _names.length; i++) {
            updateComponent(_names[i]);
        }
        deliveryDate = _deliveryDate; // Not sure we need, is hold also in the interval

        uint[] memory _intervals = new uint[](2);
        bytes32[] memory _intervalCategories = new bytes32[](2);
        _intervals[0] = _deliveryDate;
        _intervals[1] = 20 minutes;
        _intervalCategories[0] = CLEAR;
        _intervalCategories[1] = CHECK_POSITION;
        
        LockerInterface(getComponentByName(LOCKER)).setMultipleTimeIntervals(_intervalCategories, _intervals);
        checkLocker(CLEAR); // Execute the timer so gets intialized
        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        setMaxSteps(CHECK_POSITION, 10);

        // Create here ERC721
        initializeTokens();
        status = DerivativeStatus.Active;
        accumulatedFee = accumulatedFee.add(msg.value);
    }


    function initializeTokens() internal {
        longToken = new FutureERC721Token(name, symbol, LONG);
        shortToken = new FutureERC721Token(name, symbol, SHORT);
    }

    /// --------------------------------- END INITIALIZE ---------------------------------

    /// --------------------------------- ORACLES ---------------------------------

    function getTargetPrice() public view returns(uint256 _price) {
        _price =  ChainlinkInterface(getComponentByName("ChainlinkOracle")).getCurrentPrice();
    }
    function CheckOraclePriceTime() internal view returns(bool){
        if (now.sub(ChainlinkInterface(getComponentByName(ORACLE)).getLastUpdateTime()) > MAX_TIMEOUT){
            return false;
        }else{
            return true;
        }
    }
    /// --------------------------------- END ORACLES ---------------------------------

    /// --------------------------------- TOKENS ---------------------------------
    function getToken(int _direction) public view returns(FutureERC721Token) {
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

    function getValidTokenIdsByOwner(int _direction, address _owner) internal view returns (uint[] memory) {
        return getToken(_direction).getValidTokenIdsByOwner(_owner);
    }

    function getTokenActualValue(int _direction, uint _id, uint _price) public  view  returns(uint) {
        if(!isTokenValid(_direction, _id)) {return 0;}

        uint _startPrice = getToken(_direction).getBuyingPrice(_id);
        uint _tokenDeposit = getTokenDeposit(_direction, _id);

        // We avoid the negative numbers
        uint _priceDifference;
        if(_startPrice > _price) {_priceDifference = _startPrice.sub(_price);}
        else {_priceDifference = _price.sub(_startPrice);}

        /**
         * TOKEN_DENOMINATOR. (We start multiplying for the precision, as we will finis dividing)
         * .mul(_priceDifference.div(_startPrice))  We multiply per the percentage of price changed
            (price changed 2% since we buy for example)
         * .mul (DENOMINATOR.div(tokenDeposit)) We multuply per the % of the deposit.
            So if the deposit represents 5%, reduce price of 2% means a 10% of deposit reduction.
         *  .mul(tokenDeposit)  OurToken depoist multiplied 10% reduction, gets his real value (90% of the starting deposit)
         * .div(TOKEN_DENOMINATOR) Eliminate the precision.
         * All this simplify is the next formula
         */

        uint _depositUpdate = TOKEN_DENOMINATOR
            .mul(_priceDifference)
            .mul(DENOMINATOR)
            .mul(_tokenDeposit)
            .div(_startPrice.mul(depositPercentage).mul(TOKEN_DENOMINATOR))
        ;

        // LONG and Positive OR short and Negative
        if((_direction == LONG && _startPrice > _price) || (_direction == SHORT && _startPrice < _price)) {
            if(_tokenDeposit <= _depositUpdate) {return 0;}
            return _tokenDeposit.sub(_depositUpdate);
        }
        // Else
        return _tokenDeposit.add(_depositUpdate);

    }


    function getTokenBottomPosition(int _direction, uint _id) public view returns(uint) {
        uint deposit = getTokenDeposit(_direction, _id);
        return deposit.sub(deposit.mul(forceClosePositionDelta).div(DENOMINATOR)); // This DENOMINATOR is based on the deposit
    }

    // This will check all the tokens and execute the function passed as parametter
    // Require to freezeLong and freezeShort tokens before and will delete them on finish
    function checkTokens(
        function (int, uint) internal returns(bool) checkFunction
    ) internal returns (bool) {

        uint i;
        uint _transfers = initializeOrContinueStep(CHECK_POSITION);
        CheckPositionPhases _stepStatus = CheckPositionPhases(getStatusStep(CHECK_POSITION));

        // CHECK VALID LONG TOKENS
        if(_stepStatus == CheckPositionPhases.LongTokens) {

            for (i = _transfers; i < frozenLongTokens.length && goNextStep(CHECK_POSITION); i++) {
                checkFunction(LONG, frozenLongTokens[i]);
            }

            if(i == frozenLongTokens.length) {
                _stepStatus = CheckPositionPhases(updateStatusStep(CHECK_POSITION));
                _transfers = 0;
            }
        }

        // CHECK VALID SHORT TOKENS
        if(_stepStatus == CheckPositionPhases.ShortTokens) {

            for (i = _transfers; i < frozenShortTokens.length && goNextStep(CHECK_POSITION); i++) {
                checkFunction(SHORT, frozenShortTokens[i]);
            }

            // FINISH
            if(i == frozenShortTokens.length) {
                finalizeStep(CHECK_POSITION);
                delete frozenShortTokens;
                delete frozenLongTokens;
                return true;
            }
        }
        // NOT FINISH
        return false;
    }

    /// ---------------------------------  END TOKENS ---------------------------------

    /// --------------------------------- INVEST ---------------------------------
    function invest(
        int _direction, // long or short
        uint _shares // shares of the target.
        ) external payable returns (bool) {
        require(CheckOraclePriceTime(),"99");
        uint _targetPrice = getTargetPrice();
        require( status == DerivativeStatus.Active,"3");
        require(_targetPrice > 0, "4");

        uint _totalEthDeposit = calculateShareDeposit(_shares, _targetPrice);

        require(msg.value >= _totalEthDeposit ,"5"); // Enough ETH to buy the share

        require(
            getToken(_direction).mintMultiple(
            msg.sender,
            _totalEthDeposit.div(_shares),
            _targetPrice,
            _shares
        ) == true, "6");

        // Return maining ETH to the token
        msg.sender.transfer(msg.value.sub(_totalEthDeposit));

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

    /// --------------------------------- CHECK POSITION ---------------------------------
    function checkPosition() external returns (bool) {
        startGasCalculation();
        require(status != DerivativeStatus.Closed, "7");
        require(productStatus == MutexStatus.AVAILABLE || productStatus == MutexStatus.CHECK_POSITION);

         // INITIALIZE
        CheckPositionPhases _stepStatus = CheckPositionPhases(getStatusStep(CHECK_POSITION));
        if (_stepStatus == CheckPositionPhases.Initial) {
            checkLocker(CHECK_POSITION);
            frozenLongTokens = getValidTokens(LONG);
            frozenShortTokens = getValidTokens(SHORT);
            if (frozenLongTokens.length.add(frozenShortTokens.length) == 0) {
                reimburse();
                return true;
            }
            require(CheckOraclePriceTime(),"99");
            frozenPrice = getTargetPrice();
            productStatus = MutexStatus.CHECK_POSITION;
        }

        bool completed = checkTokens(checkTokenValidity);
        if(completed) {
            frozenPrice = 0;
            productStatus = MutexStatus.AVAILABLE;
        }

        reimburse();
        return completed;
    }


    function checkTokenValidity(int _direction, uint _id) internal  returns(bool){

        if(!isTokenValid(_direction, _id)) {return false;} // Check if was already invalid

        uint _tokenValue = getTokenActualValue(_direction, _id, frozenPrice);
        uint _redLine = getTokenBottomPosition(_direction, _id);

        // Is valid
        if(_tokenValue  >  _redLine) { return true;}

        // is Invalid
        // Deliver the lasting value to the user
        if(_tokenValue > 0){
            ownerOf(_direction, _id).transfer(_tokenValue); // TODO when token get holder OL-1369
            emit DepositReturned(_direction, _id, _tokenValue);
        }

        getToken(_direction).invalidateToken(_id);
        // Keep the lost investment into the winner balance
        winnersBalance = winnersBalance.add(getTokenDeposit(_direction, _id).sub(_tokenValue));

        return false;
    }
    /// --------------------------------- END CHECK POSITION ---------------------------------

    /// --------------------------------- CLEAR ---------------------------------

    // for bot.
    function clear() external returns (bool) {
        require(productStatus == MutexStatus.AVAILABLE || productStatus == MutexStatus.CLEAR);

        startGasCalculation();
        ClearPositionPhases _stepStatus = ClearPositionPhases(getStatusStep(CLEAR));
        productStatus = MutexStatus.CLEAR;

         // INITIALIZE
        if (_stepStatus == ClearPositionPhases.Initial) {
            require(status != DerivativeStatus.Closed);
            checkLocker(CLEAR);
            status = DerivativeStatus.Closed;

            frozenLongTokens = getValidTokens(LONG);
            frozenShortTokens = getValidTokens(SHORT);
            if (frozenLongTokens.length.add(frozenShortTokens.length) == 0) {
                // TODO: Special case, no winners, what to do with winnerBalance?
                accumulatedFee = accumulatedFee.add(winnersBalance);
                unfreezeClear();
                reimburse();
                return true;
            }
            require(CheckOraclePriceTime(),"99");
            frozenPrice = getTargetPrice();
            
            _stepStatus = ClearPositionPhases(updateStatusStep(CLEAR));
        }

        // CHECK LOSERS
        if(_stepStatus == ClearPositionPhases.CalculateLoses) {
            if(checkTokens(checkLosersOnClear)) {
                _stepStatus = ClearPositionPhases(updateStatusStep(CLEAR));
                // Get the valid tokens, withouth the losers
                frozenLongTokens = getValidTokens(LONG);
                frozenShortTokens = getValidTokens(SHORT);
                frozenTotalWinnersSupply = frozenLongTokens.length.add(frozenShortTokens.length);
                winnersBalanceRedeemed = 0; // We start to redeem now
                reimburse();
                return false;
            }
        }

        // CHECK WINNERS
        if(_stepStatus == ClearPositionPhases.CalculateBenefits) {
            if(checkTokens(checkWinnersOnClear)) {
                finalizeStep(CLEAR);
                if(winnersBalanceRedeemed == 0) {
                    // TODO: no winners (give to the manager?)
                    accumulatedFee = accumulatedFee.add(winnersBalance);
                }
                unfreezeClear();
                reimburse();
                return true;
            }
        }

        // NOT FINISHED
        reimburse();
        return false;
    }

    function unfreezeClear() internal {
        productStatus = MutexStatus.AVAILABLE;
        frozenTotalWinnersSupply = 0;
        winnersBalance = 0;
        frozenPrice = 0;
        winnersBalanceRedeemed = 0;
    }

    function checkLosersOnClear(int _direction, uint _id)  internal returns(bool) {
        if(!isTokenValid(_direction, _id)) {return false;} // Check if was already invalid

        uint _tokenValue = getTokenActualValue(_direction, _id, frozenPrice);
        uint _tokenDeposit = getTokenDeposit(_direction, _id);

        // Is winner
        if(_tokenValue > _tokenDeposit) { return false;}

        // Is loser
        // Deliver the lasting value to the user
        if(_tokenValue > 0){
            ownerOf(_direction, _id).transfer(_tokenValue); // TODO when token get holder OL-1369
            emit DepositReturned(_direction, _id, _tokenValue);
        }

        getToken(_direction).invalidateToken(_id);
         // Keep the lost investment into the winner balance
        winnersBalance = winnersBalance.add(_tokenDeposit.sub(_tokenValue));

        return true;
    }

    // We check token by token, but in one go with process all tokens of the same holder
    function checkWinnersOnClear(int _direction, uint _id) internal returns(bool) {
        if(!isTokenValid(_direction, _id)) {return false;} // Check if was already invalid

        uint _tokenValue = getTokenActualValue(_direction, _id, frozenPrice);
        uint _tokenDeposit = getTokenDeposit(_direction, _id);

        // Is loser (in theory shall be already out)
        if(_tokenValue  <=  _tokenDeposit) { return false;}

        address _holder = ownerOf(_direction, _id);
        // TODO: maybe is good idea to reafctor invalidateTokensByOwner and get the valid num
        uint[] memory _validTokens = getValidTokenIdsByOwner(_direction, _holder);

        uint _ethToReturn = calculateBenefits(_direction, _validTokens);
        invalidateTokens(_direction, _validTokens);

        _holder.transfer(_ethToReturn);
        emit Benefits(_direction, _holder, _ethToReturn);

        return false;
    }

    function calculateBenefits(int _direction, uint[] _winnerTokens) internal  returns(uint) {

        uint _total;
        uint _deposit;
        uint _pendingBalance;
        // We return all the deposit of the token winners + the benefits
        for(uint i = 0; i < _winnerTokens.length; i++) {
            _deposit = getTokenDeposit(_direction,_winnerTokens[i]);
            _total = _total.add(_deposit);
        }

        // Benefits in function of his total supply
        // Is important winners balance doesnt reduce, as is frozen during clear.
        uint _benefits = winnersBalance.mul(_winnerTokens.length).div(frozenTotalWinnersSupply);
        winnersBalanceRedeemed = winnersBalanceRedeemed.add(_benefits); // Keep track

        // Special cases decimals
        _pendingBalance = winnersBalance.sub(winnersBalanceRedeemed);
        if(_pendingBalance > 0 && _pendingBalance < frozenTotalWinnersSupply) {
            _benefits = _benefits.add(_pendingBalance);
        }

        return _total.add(_benefits);
    }
    /// --------------------------------- END CLEAR ---------------------------------


    /// --------------------------------- ASSETS VALUE  ---------------------------------
    function getTotalAssetValue(int /*_direction*/) external view returns (uint) {
        return 0;
    }

    // in ETH
    function getMyAssetValue(int _direction) external view returns (uint){
        uint[] memory tokens = getTokenIdsByOwner(_direction, msg.sender);
        require(CheckOraclePriceTime(),"99");
        uint price = getTargetPrice();
        uint balance;
        for(uint i = 0; i < tokens.length; i++) {
            balance = balance.add(getTokenActualValue(_direction, tokens[i], price));
        }
        return balance;
    }
    /// --------------------------------- END ASSETS VALUE  ---------------------------------

    /// --------------------------------- GETTERS   ---------------------------------
    // This is fullfulling the interface
    function getName() external view returns (string) { return name; }
    function getDescription() external view returns (string) { return description; }
    function getTarget() external view returns (uint) {return target; }// an internal Id
    function getTargetAddress() external view returns (address) { return targetAddress; } // if it’s ERC20, give it an address, otherwise 0x0
    function getDeliveryDate() external view returns (uint) { return deliveryDate; } // timestamp
    function getDepositPercentage() external view returns (uint) {return depositPercentage; }// 100 of 10000
    function getAmountOfTargetPerShare() external view returns (uint) { return amountOfTargetPerShare;}
    function getLongToken() external view returns (ERC721) {return longToken; }
    function getShortToken() external view returns (ERC721) {return shortToken; }

    // This can be removed for optimization if required
    // Only help to check interal algorithm value, but is not for use of the final user.
    // Client side could just fech them one buy one in a loop.
    function getFrozenTokens(int _direction) external view returns(uint[]) {
        if(_direction == LONG) { return frozenLongTokens;}
        if(_direction == SHORT) { return frozenShortTokens;}
        revert("8");
    }
    /// --------------------------------- END GETTERS   ---------------------------------

    /// --------------------------------- CONTRACTS CALLS   ---------------------------------
    // Rebalance
    function startGasCalculation() internal {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
    }

    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee = accumulatedFee.sub(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }

    // Locker and Step
    function checkLocker(bytes32 category) internal {
        LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(category);
    }

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

    /// --------------------------------- MANAGER   ---------------------------------

    // Payable
    function() public payable {
        revert();
    }

    function getManagerFee(uint _amount) external returns(bool) {
        require(_amount > 0, "9" );
        require(
            status == DerivativeStatus.Closed ? // everything is done, take all.
            (_amount <= accumulatedFee)
            :
            (_amount.add(INITIAL_FEE) <= accumulatedFee) // else, the initial fee stays.
            , "10");
        accumulatedFee = accumulatedFee.sub(_amount);
        owner.transfer(_amount);
        return true;
    }

    // For reiumbursable
    function addOwnerBalance() external payable {
        accumulatedFee = accumulatedFee.add(msg.value);
    }
    /// --------------------------------- END MANAGER   ---------------------------------




}
