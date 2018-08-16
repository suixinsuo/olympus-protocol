pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WhitelistInterface is ComponentInterface {

    // sender -> category -> user -> allowed
    mapping (address => mapping(uint => mapping(address => bool))) public whitelist;
    // sender -> category -> enabled
    mapping (address => mapping(uint => bool)) public enabled;

    function setStatus(uint _key, bool enable) external;
    function isAllowed(uint _key, address _account) external view returns(bool);
    function setAllowed(address[] accounts, uint _key, bool allowed) external returns(bool);
}
