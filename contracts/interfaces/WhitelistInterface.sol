pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WhitelistProviderInterface is ComponentInterface {
    mapping (uint => mapping(address => bool)) public whitelist;
    mapping (uint => bool) public whitelistEnabled;

    function enable(uint _key) external;
    function disable(uint _key) external;
    function isAllowed(uint _key, address _account) external view returns(bool);
}