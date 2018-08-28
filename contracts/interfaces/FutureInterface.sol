pragma solidity 0.4.24;


interface FutureInterface {

  function _initialize(
    address _componentList,
    uint8 _target, // an internal ID
    address _targetAddress, // if it’s ERC20, give it an address, otherwise 0x0
    uint _deliveryDate, // timestamp
    uint _depositPercentage, // 100 of 10000
    uint _amountOfTargetPerShare 
  ) external;
  // {
  //   require(_componentList != 0x0);
  //   componentList = ComponentListInterface(_componentList);    
  // }

  function invest(
      uint _direction, // long = 0 or short = 1
      uint _shares // shares of the target.
  ) external payable returns (bool);

  //function addDeposit(uint8 _direction, uint8 _amounts) external payable returns (bool);
  //function closePosition(uint _shares) external returns (bool);

  // bot system
  function position() external returns (bool); // for bot.
  function clear() external returns (bool);
  function updateTargetPrice(uint _rateToEther) external returns(bool);

  // helpers
  function getTotalAssetValue(uint _direction) external view returns (uint);
  function getMyAssetValue(uint8 _direction) external view returns (uint); // in ETH
}
