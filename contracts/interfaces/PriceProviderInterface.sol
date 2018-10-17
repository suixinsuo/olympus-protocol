pragma solidity 0.4.24;

import "./ComponentInterface.sol";
import "../libs/ERC20Extended.sol";


contract PriceProviderInterface is ComponentInterface {
    /*
     * @dev Returns the expected price for 1 of sourceAddress.
     * For ETH, use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
     * @param address _sourceAddress The token to sell for the destAddress.
     * @param address _destAddress The token to buy with the source token.
     * @param uint _amount The amount of tokens which is wanted to buy.
     * @param bytes32 _exchangeId The exchangeId to choose. If it's an empty string, then the exchange will be chosen automatically.
     * @return returns the expected and slippage rate for the specified conversion
     */
    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId)
        external view returns(uint expectedRate, uint slippageRate);

    /*
     * @dev Returns the expected price for 1 of sourceAddress. If it's currently not available, the last known price will be returned from cache.
     * Note: when the price comes from cache, this should only be used as a backup, when there are no alternatives
     * For ETH, use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
     * @param address _sourceAddress The token to sell for the destAddress.
     * @param address _destAddress The token to buy with the source token.
     * @param uint _amount The amount of tokens which is wanted to buy.
     * @param bytes32 _exchangeId The exchangeId to choose. If it's an empty string, then the exchange will be chosen automatically.
     * @param uint _maxPriceAgeIfCache If the price is not available at the moment, choose the maximum age in seconds of the cached price to return.
     * @return returns the expected and slippage rate for the specified conversion and whether or not the price comes from cache
     */
    function getPriceOrCacheFallback(
        ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId, uint _maxPriceAgeIfCache)
        external returns(uint expectedRate, uint slippageRate, bool isCached);

    /*
     * @dev Returns the prices for multiple tokens in the form of ETH to token rates. If their prices are currently not available, the last known prices will be returned from cache.
     * Note: when the price comes from cache, this should only be used as a backup, when there are no alternatives
     * @param address _destAddress The token for which to get the ETH to token rate.
     * @param uint _maxPriceAgeIfCache If any price is not available at the moment, choose the maximum age in seconds of the cached price to return.
     * @return returns an array of the expected and slippage rates for the specified tokens and whether or not the price comes from cache
     */
    function getMultiplePricesOrCacheFallback(ERC20Extended[] _destAddresses, uint _maxPriceAgeIfCache)
        external returns(uint[] expectedRates, uint[] slippageRates, bool[] isCached);
}
