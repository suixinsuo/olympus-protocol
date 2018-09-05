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

contract FutureContract is BaseDerivative, FutureInterfaceV1 {

    using SafeMath for uint256;

    // Enum and constants
    int public constant LONG = -1;
    int public constant SHORT = 1;
    enum FuturePhases { Initial, LongTokens, ShortTokens }
    // Action of the Future
    bytes32 public constant CLEAR = "Clear";
    bytes32 public constant CHECK_POSITION = "CheckPosition";
    // Basic information that is override on creation
    string public name = "Olympus Future";
    string public description = "Olympus Future";
    string public version = "v0.1";
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
    uint public outLongSupply;
    FutureERC721Token public shortToken;
    uint public outShortSupply;
    uint public winnersBalance;
    // Manager balance for reiumursable
    uint public accumulatedFee;
    // Check position freeze data
    uint[] public freezeLongTokens;
    uint[] public freezeShortTokens;
    uint freezePrice;
    // TODO: Change this event for real transfer to user holder OL-1369
    event DepositReturned(uint _tokenId, uint amount);

    constructor(
      string _name,
      string _description,
      string _symbol,
      uint _target,
      address _targetAddress,
      uint _amountOfTargetPerShare,
      uint _depositPercentage,
      uint _forceClosePositionDelta
    ) public {
        name = _name;
        description = _description;
        symbol = _symbol;
        target = _target;
        targetAddress = _targetAddress;
        amountOfTargetPerShare = _amountOfTargetPerShare;
        depositPercentage = _depositPercentage;
        forceClosePositionDelta = _forceClosePositionDelta;
        //
        status = DerivativeStatus.New;
    }



    function initialize(address _componentList, uint _deliveryDate) public payable {

        require(status == DerivativeStatus.New);
        require(msg.value > 0); // Require some balance for internal opeations as reimbursable

        _initialize(_componentList);
        bytes32[4] memory _names = [MARKET, LOCKER, REIMBURSABLE, STEP];

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
        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        setMaxSteps(CHECK_POSITION, 10);

        // Create here ERC721
        initializeTokens();
        status = DerivativeStatus.Active;
        accumulatedFee = accumulatedFee.add(msg.value);
    }

    function getTargetPrice() public view returns(uint) {
        return targetPrice;
    }



    function initializeTokens() internal {
        longToken = new FutureERC721Token(name, symbol, LONG);
        shortToken = new FutureERC721Token(name, symbol, SHORT);
        outLongSupply = 0;
        outShortSupply = 0;
    }

    // Return the value required to buy a share to a current price
    function calculateShareDeposit(uint _amountOfShares, uint _targetPrice) public view returns(uint) {
        return _amountOfShares
            .mul(amountOfTargetPerShare)
            .mul(_targetPrice)
            .mul(depositPercentage)
            .div(DENOMINATOR);
    }

    /// --------------------------------- TOKENS ---------------------------------
    function getToken(int _direction) public view returns(FutureERC721Token) {
        if(_direction == LONG) {return longToken; }
        if(_direction == SHORT) {return shortToken; }
        revert();
    }

    function getTokenOutSupply(int _direction) public view returns(uint) {
        if(_direction == LONG) {return outLongSupply; }
        if(_direction == SHORT) {return outShortSupply; }
        revert();
    }

    function increaseOutSupply(int _direction) internal {
        if(_direction == LONG) { outLongSupply++;  return;}
        if(_direction == SHORT) { outShortSupply++; return; }
        revert();
    }

    function isTokenValid(int _direction, uint _id) public view returns(bool) {
        return getToken(_direction).isTokenValid(_id);
    }

    function getTokenDeposit(int _direction, uint _id) public view returns(uint) {
        return getToken(_direction).getDeposit(_id);
    }

    function getValidTokens(int _direction) public view returns(uint[] memory) {
        return getToken(_direction).getValidTokens();
    }


    function getTokenSupply(int _direction) public  view returns(uint) {
        return getToken(_direction).totalSupply().sub(getTokenOutSupply(_direction));
    }


    function getTokenActualValue(int _direction, uint _id, uint _price) public  view  returns(uint) {
        if(!isTokenValid(_direction, _id)) {return 0;}

        uint _startPrice = getToken(_direction).getBuyingPrice(_id);
        uint _tokenDeposit = getTokenDeposit(_direction, _id);

        // We avoid the negative numbers
        uint _priceDifference;
        if(_startPrice > _price) {_priceDifference = _startPrice.sub(_price);}
        else {_priceDifference = _price.sub(_startPrice);}

        uint _depositUpdate =   _priceDifference
            .mul(DENOMINATOR)
            .div(_startPrice)
            .mul(DENOMINATOR.div(depositPercentage))
            .mul(_tokenDeposit)
            .div(DENOMINATOR)
            ;


          // LONG and Positive OR short and Negative
        if((_direction == LONG && _startPrice > _price) || (_direction == SHORT && _startPrice < _price)) {


            if(_tokenDeposit <= _depositUpdate) {return 0;}
            return _tokenDeposit.sub(_depositUpdate);
        }
        // Else
        return _tokenDeposit.add(_depositUpdate);

     }


    function getTokenRedLine(int _direction, uint _id) public view returns(uint) {
        uint deposit = getTokenDeposit(_direction, _id);
        return deposit.sub(deposit.mul(forceClosePositionDelta).div(DENOMINATOR));
    }

    /// --------------------------------- INVEST ---------------------------------
    function invest(
        int _direction, // long or short
        uint _shares // shares of the target.
        ) external payable returns (bool) {

        uint _targetPrice = getTargetPrice();
        require( status == DerivativeStatus.Active);
        require(_targetPrice > 0);

        uint _totalEthDeposit = calculateShareDeposit(_shares, _targetPrice);

        require(msg.value >= _totalEthDeposit ); // Enough ETH to buy the share

        require(getToken(_direction).mintMultiple(
            msg.sender,
            _totalEthDeposit.div(_shares),
            _targetPrice,
            _shares
        ) == true);

        // Return maining ETH to the token
        msg.sender.transfer(msg.value.sub(_totalEthDeposit.mul(_shares)));
        return true;
    }

    // bot system
    function checkPosition() external returns (bool) {
        startGasCalculation();

        FuturePhases _stepStatus = FuturePhases(getStatusStep(CHECK_POSITION));
        uint i;

        // INITIALIZE
        if (_stepStatus == FuturePhases.Initial) {
            checkLocker(CHECK_POSITION);
            freezeLongTokens = getValidTokens(LONG);
            freezeShortTokens = getValidTokens(SHORT);
            if (freezeLongTokens.length.add(freezeShortTokens.length) == 0) {
                reimburse();
                return true;
            }
            _stepStatus = FuturePhases(uint(_stepStatus)+1);
            freezePrice = getTargetPrice();
        }
        uint _transfers = initializeOrContinueStep(CHECK_POSITION);

        // CHECK VALID LONG TOKENS
        if(_stepStatus == FuturePhases.LongTokens) {

            for (i = _transfers; i < freezeLongTokens.length && goNextStep(CHECK_POSITION); i++) {
                checkTokenValidity(LONG, freezeLongTokens[i]);
            }

            if(i == freezeLongTokens.length) {
                updateStatusStep(CHECK_POSITION);
                _stepStatus = FuturePhases(uint(_stepStatus)+1);
                _transfers = 0;
            }
        }

        // CHECK VALID SHORT TOKENS
        if(_stepStatus == FuturePhases.ShortTokens) {

            for (i = _transfers; i < freezeShortTokens.length && goNextStep(CHECK_POSITION); i++) {
                checkTokenValidity(SHORT, freezeShortTokens[i]);
            }

            // FINISH
            if(i == freezeShortTokens.length) {
                finalizeStep(CHECK_POSITION);
                delete freezeShortTokens;
                delete freezeLongTokens;
                freezePrice = 0;
                reimburse();
                return true;
            }
        }
        // NOT FINISH
        reimburse();
        return false;
    }

    function checkTokenValidity(int _direction, uint _id) internal  returns(bool){

        if(!isTokenValid(_direction, _id)) {return false;} // Check if was already invalid

        uint _tokenValue = getTokenActualValue(_direction, _id, freezePrice);
        uint _redLine = getTokenRedLine(_direction, _id);

        // Is valid
        if(_tokenValue  >  _redLine) { return true;}

        // is Invalid
        // Deliver the lasting value to the user
        if(_tokenValue > 0){
            // getToken(_direction).holder().transfer(_tokenValue); // TODO when token get holder OL-1369
            emit DepositReturned(_id, _tokenValue);
        }

        getToken(_direction).invalidateToken(_id);
        increaseOutSupply(_direction);
        winnersBalance =  winnersBalance.add(getTokenDeposit(_direction, _id).sub(_tokenValue)); // Keep the lost investment into the winner balance

        return false;
    }

    // for bot.
    function clear() external returns (bool) {
        return false;
    }

    function updateTargetPrice(uint /*_rateToEther*/) external returns(bool) {
        return false;
    }

    // helpers
    function getTotalAssetValue(uint /*_direction*/) external view returns (uint) {
        return 0;
    }



    // in ETH
    function getMyAssetValue(uint8 /*_direction*/) external view returns (uint){
        // TODO: Check the type of tokens of user that belongs to the direction.
        // For each token which is not out of the game make next operation
        // forEach(token) => getActualTokenValue(t)
        return 0;
    }

    // Getters
    function getName() external view returns (string) { return name; }
    function getDescription() external view returns (string) { return description; }

    function getTarget() external view returns (uint) {return target; }// an internal Id
    function getTargetAddress() external view returns (address) { return targetAddress; } // if it’s ERC20, give it an address, otherwise 0x0
    function getDeliveryDate() external view returns (uint) { return deliveryDate; } // timestamp
    function getDepositPercentage() external view returns (uint) {return depositPercentage; }// 100 of 10000
    function getAmountOfTargetPerShare() external view returns (uint) { return amountOfTargetPerShare;}
    function getLongToken() external view returns (ERC721) {return longToken; }
    function getShortToken() external view returns (ERC721) {return shortToken; }

    // Call to other contracts
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

    function updateStatusStep(bytes32 category) internal returns(bool) {
        return StepInterface(ReimbursableInterface(getComponentByName(STEP))).updateStatus(category);
    }

    function setMaxSteps( bytes32 _category,uint _maxSteps) public onlyOwner {
        StepInterface(getComponentByName(STEP)).setMaxCalls(_category,  _maxSteps);
    }


    // Payable
    function() public payable {
        revert();
    }

    // For reiumbursable
    function addOwnerBalance() external payable {
        accumulatedFee = accumulatedFee.add(msg.value);
    }



}
