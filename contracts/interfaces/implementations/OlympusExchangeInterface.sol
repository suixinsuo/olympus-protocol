pragma solidity 0.4.24;

import "../ExchangeInterface.sol";
import "../PriceProviderInterface.sol";
import "../../libs/Ownable.sol";


contract OlympusExchangeInterface is ExchangeInterface, PriceProviderInterface, Ownable {
    /*
     * @dev Buy multiple tokens at once with ETH.
     * @param ERC20[] _tokens The tokens to buy, should be an array of ERC20 addresses.
     * @param uint[] _amounts Amount of ETH used to buy this token. Make sure the value sent to this function is the same as the sum of this array.
     * @param uint[] _minimumRates The minimum amount of tokens to receive for 1 ETH.
     * @param address _depositAddress The address to send the bought tokens to.
     * @param bytes32 _exchangeId The exchangeId to choose. If it's an empty string, then the exchange will be chosen automatically.
     * @param address _partnerId If the exchange supports a partnerId, you can supply your partnerId here
     * @return boolean boolean whether or not the trade succeeded.
     */
    function buyTokens
        (
        ERC20[] _tokens, uint[] _amounts, uint[] _minimumRates,
        address _depositAddress, bytes32 _exchangeId, address _partnerId
        ) external payable returns(bool success);

    /*
     * @dev Sell multiple tokens at once with ETH, make sure all of the tokens are approved to be transferred beforehand with the Olympus Exchange address.
     * @param ERC20[] _tokens The tokens to sell, should be an array of ERC20 addresses.
     * @param uint[] _amounts Amount of tokens to sell this token. Make sure the value sent to this function is the same as the sum of this array.
     * @param uint[] _minimumRates The minimum amount of ETH to receive for 1 specified ERC20 token.
     * @param address _depositAddress The address to send the bought tokens to.
     * @param bytes32 _exchangeId The exchangeId to choose. If it's an empty string, then the exchange will be chosen automatically.
     * @param address _partnerId If the exchange supports a partnerId, you can supply your partnerId here
     * @return boolean boolean whether or not the trade succeeded.
     */
    function sellTokens
        (
        ERC20[] _tokens, uint[] _amounts, uint[] _rates,
        address _depositAddress, string _exchangeId, address _partnerId
        ) external returns(bool success);
}
