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


    function invest(
        uint /*_direction*/, // long or short
        uint/*_shares*/ // shares of the target.
        ) external payable returns (bool) {
        return false;
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
    // in ETH
    function getMyAssetValue(uint8 /*_direction*/) external view returns (uint){
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
