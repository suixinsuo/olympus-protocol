pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WhitelistInterface is ComponentInterface {

    // sender -> category -> user -> allowed
    mapping (address => mapping(uint => mapping(address => bool))) public whitelist;
    // sender -> category -> enabled
    mapping (address => mapping(uint => bool)) public enabled;

    function enable(uint _key) external;
    function disable(uint _key) external;
    function isAllowed(uint _key, address _account) external view returns(bool);
    function setAllowed(address[] accounts, uint _key, bool allowed) external returns(bool);
}
