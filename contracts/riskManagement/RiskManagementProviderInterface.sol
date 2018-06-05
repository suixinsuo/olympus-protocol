pragma solidity ^0.4.18;

import "../libs/Provider.sol";

contract RiskManagementProviderInterface is Provider {
    function enable() public;
    function disable() public;
    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint256 _amount, uint256 price) external view returns(bool);
}
