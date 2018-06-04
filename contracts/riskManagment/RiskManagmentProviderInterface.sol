pragma solidity ^0.4.18;

import "../libs/Provider.sol";

contract RiskManagmentProviderInterface is Provider {
    function enable() public;
    function disable() public;
    function hasRisk(address _sender, address _receiver, address _tokenAddress, uint256 _amount) external view returns(bool);
}
