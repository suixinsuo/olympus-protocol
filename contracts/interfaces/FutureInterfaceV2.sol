pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721.sol";


interface FutureInterfaceV2 {
  function getName() external view returns (string);
  function getDescription() external view returns (string);

  function getTarget() external view returns (uint); // an internal Id
  function getTargetAddress() external view returns (address); // if it’s ERC20, give it an address, otherwise 0x0
  function getTimeInterval() external view returns (uint,uint); // Time interval start,end.

  function getToken() external view returns (ERC721);

  function invest(
      int _direction, // long = -1 or short = 1
      uint _shares // shares of the target.
  ) external payable returns (bool);

  // bot system
  function clear() external returns (bool);
  // function updateTargetPrice(uint _rateToEther) external returns(bool); TODO when bot

  // helpers
  function getTotalAssetValue(int _direction) external view returns (uint);
  function getMyAssetValue(int _direction) external view returns (uint); // in ETH
}
