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
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";


contract FutureContract is BaseDerivative, FutureInterfaceV1 {

    using SafeMath for uint256;

    ERC721Token public longToken;
    ERC721Token public shortToken;
    ComponentListInterface public componentList;

    string public name = "Olympus Future";
    string public description = "Olympus Future";
    string public version = "v0.1";


    uint public target;
    address public targetAddress;
    uint public deliveryDate;
    uint public depositPercentage;
    uint public forceClosePositionDelta;

    uint public amountOfTargetPerShare;
    uint public accumulatedFee;

    bytes32 public constant CLEAR = "Clear";
    event Transfer(address indexed from, address indexed to, uint tokens);

    enum FutureDirection {
        Long,
        Short
    }

    constructor(
      string _name,
      string _description,
      uint _target,
      address _targetAddress,
      uint _amountOfTargetPerShare,
      uint _depositPercentage,
      uint _forceClosePositionDelta
    ) public {
        name = _name;
        description = _description;
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

        // TODO: Create here ERC721
        status = DerivativeStatus.Active;
        accumulatedFee = accumulatedFee.add(msg.value);
    }
    function getTargetPrice() public returns(uint) {
        return 10**18;
    }

    // Return the value required to buy a share to a current price
    function calculateShareDeposit(uint _amountOfShares) public returns(uint) {
        return _amountOfShares
            .mul(amountOfTargetPerShare)
            .mul(getTargetPrice())
            .mul(depositPercentage)
            .div(DENOMINATOR);
    }

    function invest(
        uint /*_direction*/, // long or short
        uint _shares // shares of the target.
        ) external payable returns (bool) {

        uint _etDeposit = calculateShareDeposit(_shares);
        require(msg.value >= _etDeposit ); // Enough ETH to buy the share

        // MINT token
        // token.deposit = _etDeposit;
        // token.direction = _direction;
        // token.price = getTargetPrice()
        // Return maining ETH to the token
        msg.sender.transfer(msg.value.sub(_ethRequired));
        emit Transfer(0x0,msg.sender,_shares); // TODO? Do it from here?
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

    function getActualTokenValue(uint /*token*/) internal returns(uint) {
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
