pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721.sol";


interface FutureInterfaceV1 {
  function getName() external view returns (string);
  function getDescription() external view returns (string);

  function getTarget() external view returns (uint); // an internal Id
  function getTargetAddress() external view returns (address); // if it’s ERC20, give it an address, otherwise 0x0
  function getDeliveryDate() external view returns (uint); // timestamp
  function getDepositPercentage() external view returns (uint); // 100 of 10000
  function getAmountOfTargetPerShare() external view returns (uint);

  function getLongToken() external view returns (ERC721);
  function getShortToken() external view returns (ERC721);

  // Has to be internal, last time we added as abstract in a interface which was a contract
  // Lets discuss
  // function _initialize(
  //   address _componentList
  // ) external;

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
