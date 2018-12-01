pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721.sol";


interface BinaryFutureInterface {
  function getName() external view returns (string);
  function getDescription() external view returns (string);

  function getTargetAddress() external view returns (address); // if it’s ERC20, give it an address, otherwise 0x0

  function invest(
      int _direction, // long = -1 or short = 1
      uint _period
  ) external payable returns (bool);

  function clear(uint _period) external returns (bool);

}
