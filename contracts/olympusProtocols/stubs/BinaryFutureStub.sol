pragma solidity 0.4.24;

import "../BinaryFuture.sol";


contract BinaryFutureStub is BinaryFuture {

    uint public constant DISABLED_VALUE = 1;
    uint public mockPeriod = DISABLED_VALUE;
    uint public mockTargetPrice = DISABLED_VALUE;

    constructor(
      string _name,
      string _description,
      string _symbol,
      bytes32 _category,
      address _targetAddress,
      uint _investingPeriod
      ) public BinaryFuture(
        _name,
        _description,
        _symbol,
        _category,
        _targetAddress,
        _investingPeriod) {
    }

    /// --------------------------------- MOCKS ---------------------------------
    event Mock(uint value, string message);
    function setMockPeriod(uint _period) public {
        mockPeriod = _period;
        emit Mock( mockPeriod, 'Period');
    }


    function getCurrentPeriod() public view returns(uint) {
        if(mockPeriod == DISABLED_VALUE) {
            return super.getPeriod(now);
        }
        return mockPeriod;
    }


    function setMockTargetPrice(uint _targetPrice) public  {
        mockTargetPrice = _targetPrice;
        emit Mock(mockTargetPrice, 'Price');
    }

    function getTargetPrice() public view returns(uint) {
        if(mockTargetPrice == DISABLED_VALUE) {
            return super.getTargetPrice();
        }
        return mockTargetPrice;
    }

    /// --------------------------------- END MOCKS ---------------------------------


    /// --------------------------------- STUBS ---------------------------------
    /// Override main functions

    function invest(int  _direction, uint _period) external payable returns (bool) {
        _invest(_direction, _period, getCurrentPeriod(), getTargetPrice());
    }

    function clear(uint _period) external returns (bool) {
        return _clear(_period, getCurrentPeriod(), getTargetPrice());
    }

  /// --------------------------------- END STUBS ---------------------------------


}
