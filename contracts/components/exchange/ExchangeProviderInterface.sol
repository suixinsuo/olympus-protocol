pragma solidity ^0.4.17;

import "../../libs/ERC20.sol";

contract ExchangeProviderInterface {
    function checkTokenSupported(ERC20 token) external view returns (bool);
    function buyToken(bytes32 exchangeId, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external payable returns(bool);
    function sellToken(bytes32 exchangeId, ERC20[] tokens, uint256[] amounts, uint256[] rates, address deposit) external returns(bool);
}
