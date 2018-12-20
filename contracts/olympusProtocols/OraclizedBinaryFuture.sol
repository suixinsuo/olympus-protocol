pragma solidity 0.4.24;

import "./BinaryFuture.sol";


contract OraclizedBinaryFuture is BinaryFuture {

    uint public oraclePrice;
    uint public lastTimeUpdated;
    uint public allowedPriceInterval; // Seconds. The time interval consider as valid to retreive a oraclePrice

    /// --------------------------------- CONFIG ---------------------------------
    // Constructor is the same, solidity requires to override
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

    // Added extra parametter to initialize
    function initialize(address _componentList,uint _fee, uint _allowedPriceInterval) public payable {
        super.initialize(_componentList, _fee);
        allowedPriceInterval = _allowedPriceInterval;
    }
    /// --------------------------------- END CONFIG ---------------------------------


    /// --------------------------------- ORACLE ---------------------------------
    function setOracleTargetPrice(uint _targetPrice) onlyOwner external {
        oraclePrice = _targetPrice;
        lastTimeUpdated = now;
    }

    function getTargetPrice() public view returns(uint) {
        require(now.sub(lastTimeUpdated) <= allowedPriceInterval);
        return oraclePrice;
    }
    /// --------------------------------- END ORACLE ---------------------------------


    /// --------------------------------- STUBS ---------------------------------
    /// Override main functions

    function invest(int  _direction, uint _period) external payable returns (bool) {
        _invest(_direction, _period, super.getCurrentPeriod(), getTargetPrice());
    }

    function clear(uint _period) external returns (bool) {
        return _clear(_period, super.getCurrentPeriod(), getTargetPrice());
    }
  /// --------------------------------- END STUBS ---------------------------------


}
