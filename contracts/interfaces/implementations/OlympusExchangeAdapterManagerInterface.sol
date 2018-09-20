pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../libs/ERC20Extended.sol";

contract OlympusExchangeAdapterManagerInterface is Ownable {
    function pickExchange(ERC20Extended _src,ERC20Extended _dest, uint _amount, uint _rate) public view returns (bytes32 exchangeId);
    function supportsTradingPair(address _srcAddress, address _destAddress, bytes32 _exchangeId) external view returns(bool supported);
    function getExchangeAdapter(bytes32 _exchangeId) external view returns(address);
    function isValidAdapter(address _adapter) external view returns(bool);
    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId)
        external view returns(uint expectedRate, uint slippageRate);
    function getPrices(ERC20Extended[] _destAddresses)
        external view returns(uint[] expectedRates, uint[] slippageRates);
    function removeExchangeAdapter(bytes32 _exchangeId) external returns (bool);
}
