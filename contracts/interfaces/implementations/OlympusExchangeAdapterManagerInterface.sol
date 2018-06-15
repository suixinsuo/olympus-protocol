pragma solidity 0.4.24;

import "../../libs/ERC20.sol";

interface OlympusExchangeAdapterManagerInterface {
    function pickExchange(ERC20 token, uint amount, uint rate) external view returns (bytes32 exchangeId);
    function checkTokenSupported(ERC20 token) external view returns(bool);
    function getExchangeAdapter(bytes32 exchangeId) external view returns(address);
    function isValidAdapter(address adapter) external view returns(bool);
}
