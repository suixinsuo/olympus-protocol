pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721.sol";


interface FutureInterfaceV1 {
  function name() external view returns (string);
  function description() external view returns (string);

  function target() external view returns (uint); // an internal Id
  function targetAddress() external view returns (address); // if it’s ERC20, give it an address, otherwise 0x0
  function deliveryDate() external view returns (uint); // timestamp
  function depositPercentage() external view returns (uint); // 100 of 10000
  function amountOfTargetPerShare() external view returns (uint);

  function longToken() external view returns (ERC721);
  function shortToken() external view returns (ERC721);

  function _initialize(
    address _componentList
  ) external; 

  function invest(
      uint _direction, // long = 0 or short = 1
      uint _shares // shares of the target.
  ) external payable returns (bool);

  // bot system
  function checkPosition() external returns (bool); // for bot.
  function clear() external returns (bool);
  function updateTargetPrice(uint _rateToEther) external returns(bool);

  // helpers
  function getTotalAssetValue(uint _direction) external view returns (uint);
  function getMyAssetValue(uint8 _direction) external view returns (uint); // in ETH
}
