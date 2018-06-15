pragma solidity 0.4.24;

import "../../libs/utils.sol";
import "../ExchangeInterface.sol";
import "./KyberNetworkInterface.sol";
import "../../libs/Ownable.sol";


contract OlympusExchangeAdapterInterface is ExchangeInterface, Ownable {

    // Overwrite functions, because we don't need the exchangeId here
    // Except for the buyToken, we don't overwrite that
    // Because of issues with the overloading of payable functions
    function supportsTradingPair(address _srcAddress, address _destAddress)
        external view returns(bool supported);

    function getPrice(ERC20 _sourceAddress, ERC20 _destAddress, uint _amount)
        public view returns(uint expectedRate, uint slippageRate);

    function sellToken
        (
        ERC20 _token, uint _amount, uint _minimumRate,
        address _depositAddress, address _partnerId
        ) external returns(bool success);

    function enable() external returns(bool);
    function disable() external returns(bool);
    function isEnabled() external view returns (bool success);

    function configAdapter(KyberNetworkInterface _kyber, address _walletId) external returns(bool success);
    function setExchangeDetails(bytes32 _id, bytes32 _name) external returns(bool success);
    function getExchangeDetails() external view returns(bytes32 _name, bool _enabled);

}
