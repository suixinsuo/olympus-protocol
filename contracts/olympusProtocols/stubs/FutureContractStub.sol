pragma solidity 0.4.24;

import "../FutureContract.sol";
import "../../interfaces/LockerInterface.sol";


contract FutureContractStub is FutureContract  {

    constructor(
        string _name,
        string _description,
        string _symbol,
        uint _target,
        address _targetAddress,
        uint _amountOfTargetPerShare,
        uint _depositPercentage,
        uint _forceClosePositionDelta
      ) public FutureContract(
        _name,
        _description,
        _symbol,
        _target,
        _targetAddress,
        _amountOfTargetPerShare,
        _depositPercentage,
        _forceClosePositionDelta) {
    }

    function setTargetPrice(uint _price) external returns(uint) {
        targetPrice = _price;
    }

    function setTimeInterval(bytes32 _cateogory , uint _seconds) external {
        LockerInterface(getComponentByName(LOCKER)).setTimeInterval(_cateogory, _seconds);
    }
 }
