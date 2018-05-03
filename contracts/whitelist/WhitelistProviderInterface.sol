pragma solidity ^0.4.18;

import "../libs/Provider.sol";

contract WhitelistProviderInterface is Provider {
    function isAllowed(address account) external view returns(bool);
}