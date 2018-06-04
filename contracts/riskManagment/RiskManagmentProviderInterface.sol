pragma solidity ^0.4.18;

import "../libs/Provider.sol";

contract RiskManagmentProviderInterface is Provider {
    function hasRisk(address account) external view returns(address);
}
