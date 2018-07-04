pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WhitelistInterface is ComponentInterface {

    // sender -> category -> user -> allowed
    mapping (address => mapping(uint8 => mapping(address => bool))) public whitelist;
    // sender -> category -> enabled
    mapping (address => mapping(uint8 => bool)) public enabled;

    function enable(uint8 _key) external;
    function disable(uint8 _key) external;
    function isAllowed(uint8 _key, address _account) external view returns(bool);
    function setAllowed(address[] accounts, uint8 _key, bool allowed) external returns(bool);
}
