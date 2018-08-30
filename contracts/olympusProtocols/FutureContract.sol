pragma solidity 0.4.24;

import "../interfaces/ComponentContainerInterface.sol";
import "../interfaces/FutureInterfaceV1.sol";
import "../interfaces/LockerInterface.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/ComponentListInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../BaseDerivative.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./tokens/FutureERC721Token.sol";

contract FutureContract is BaseDerivative, FutureInterfaceV1 {

    using SafeMath for uint256;

    FutureERC721Token public longToken;
    uint public outLongSupply;
    FutureERC721Token public shortToken;
    uint public outShortSupply;

    ComponentListInterface public componentList;

    string public name = "Olympus Future";
    string public description = "Olympus Future";
    string public version = "v0.1";
    string public symbol;

    uint public target;
    address public targetAddress;
    uint public targetPrice;
    uint public deliveryDate;
    uint public depositPercentage;
    uint public forceClosePositionDelta;

    uint public amountOfTargetPerShare;
    uint public accumulatedFee;

    bytes32 public constant CLEAR = "Clear";
    event Transfer(address indexed from, address indexed to, uint tokens);

    int public constant LONG = -1;
    int public constant SHORT = 1;

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
        bytes32[3] memory _names = [MARKET, LOCKER, REIMBURSABLE];

        for (uint i = 0; i < _names.length; i++) {
            updateComponent(_names[i]);
        }
        deliveryDate = _deliveryDate; // Not sure we need, is hold also in the interval
        LockerInterface(getComponentByName(LOCKER)).setTimeInterval(CLEAR, _deliveryDate);
        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();

        // Create here ERC721
        initializeTokens();
        status = DerivativeStatus.Active;
        accumulatedFee = accumulatedFee.add(msg.value);
    }

    function getTargetPrice() public view returns(uint) {
        return targetPrice;
    }

    function setTargetPrice(uint _price) public returns(uint) {
        targetPrice = _price;
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
            .mul(_targetPrice)
            .mul(depositPercentage)
            .div(DENOMINATOR);
    }

    function getToken(int _direction) internal view returns(FutureERC721Token) {
        if(_direction == LONG) {return longToken; }
        if(_direction == SHORT) {return shortToken; }
        revert();
    }

    function invest(
        int _direction, // long or short
        uint _shares // shares of the target.
        ) external payable returns (bool) {

        uint _targetPrice = getTargetPrice();
        require(_targetPrice > 0);

        uint _ethDeposit = calculateShareDeposit(_shares, _targetPrice);

        require(msg.value >= _ethDeposit.mul(_shares) ); // Enough ETH to buy the share

        getToken(_direction).mintMultiple(
          msg.sender,
          _ethDeposit,
          _targetPrice,
          _shares
        );

        // Return maining ETH to the token
        msg.sender.transfer(msg.value.sub(_ethDeposit.mul(_shares)));
        return true;
    }

    // bot system
    function checkPosition() external returns (bool) {
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

    function getActualTokenValue(uint /*token*/) internal view returns(uint) {

        // int difference = (t.startPrice-currentPrice)*t.NumberofShare*amountPerShare
        // int _difference = amountOfTargetPerShare.mul(t.startPrice.sub(getTargetPrice())).mul(t.numberOfShares);
        // Buy -1, Sell 1
        // uint  actualValue = t.deposit.add(_difference.mul(direction));
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

    // Payable
    function() public payable {
        revert();
    }

    // For reiumbursable
    function addOwnerBalance() external payable onlyOwner {
        accumulatedFee = accumulatedFee.add(msg.value);
    }



}
