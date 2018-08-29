pragma solidity 0.4.24;

import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterManagerInterface.sol";


contract ExchangeAdapterManager is OlympusExchangeAdapterManagerInterface {

    mapping(bytes32 => OlympusExchangeAdapterInterface) public exchangeAdapters;
    bytes32[] public exchanges;
    uint private genExchangeId = 1000;
    mapping(address=>uint) private adapters;
    ERC20Extended private constant ETH_TOKEN_ADDRESS = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    event AddedExchange(bytes32 id);

    function addExchange(bytes32 _name, address _adapter)
    external onlyOwner returns(bool) {
        require(_adapter != 0x0);
        bytes32 id = keccak256(abi.encodePacked(_adapter, genExchangeId++));
        require(OlympusExchangeAdapterInterface(_adapter).setExchangeDetails(id, _name));
        exchanges.push(id);
        exchangeAdapters[id] = OlympusExchangeAdapterInterface(_adapter);
        adapters[_adapter]++;

        emit AddedExchange(id);
        return true;
    }

    function getExchanges() external view returns(bytes32[]) {
        return exchanges;
    }

    function getExchangeInfo(bytes32 _id)
    external view returns(bytes32 name, bool status) {
        OlympusExchangeAdapterInterface adapter = exchangeAdapters[_id];
        require(address(adapter) != 0x0);

        return adapter.getExchangeDetails();
    }

    function getExchangeAdapter(bytes32 _id)
    external view returns(address)
    {
        return address(exchangeAdapters[_id]);
    }

    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount, bytes32 _exchangeId)
        external view returns(uint expectedRate, uint slippageRate) {

        if(_exchangeId != 0x0) {
            return exchangeAdapters[_exchangeId].getPrice(_sourceAddress, _destAddress, _amount);
        }
        bytes32 exchangeId = _sourceAddress == ETH_TOKEN_ADDRESS ?
        pickExchange(ETH_TOKEN_ADDRESS, _destAddress, _amount, 0) :
        pickExchange(_sourceAddress, ETH_TOKEN_ADDRESS, _amount, 0);
        if(exchangeId != 0x0) {
            OlympusExchangeAdapterInterface adapter = exchangeAdapters[exchangeId];
            return adapter.getPrice(_sourceAddress, _destAddress, _amount);
        }
        return(0, 0);
    }

    /// >0  : found exchangeId
    /// ==0 : not found
    function pickExchange(ERC20Extended _src, ERC20Extended _dest, uint _amount, uint _rate) public view returns (bytes32 exchangeId) {

        int maxRate = -1;
        bytes32 bestRateID;
        for (uint i = 0; i < exchanges.length; i++) {

            bytes32 id = exchanges[i];
            OlympusExchangeAdapterInterface adapter = exchangeAdapters[id];
            if (!adapter.isEnabled()) {
                continue;
            }
            uint adapterResultRate;
            uint adapterResultSlippage;

            (adapterResultRate,adapterResultSlippage) = adapter.getPrice(_src, _dest, _amount);

            int resultRate = int(adapterResultSlippage);


            if (adapterResultRate == 0) { // not support
                continue;
            }

            if (resultRate < int(_rate)) {
                continue;
            }

            if (resultRate >= maxRate) {
                maxRate = resultRate;
                bestRateID = id;
            }
        }
        return bestRateID;
    }

    function supportsTradingPair(address _srcAddress, address _destAddress, bytes32 _exchangeId) external view returns (bool) {
        OlympusExchangeAdapterInterface adapter;
        if(_exchangeId != ""){
            adapter = exchangeAdapters[id];
            if(!adapter.isEnabled()){
                return false;
            }
            if (adapter.supportsTradingPair(_srcAddress, _destAddress)) {
                return true;
            }
            return false;
        }
        for (uint i = 0; i < exchanges.length; i++) {
            bytes32 id = exchanges[i];
            adapter = exchangeAdapters[id];
            if (!adapter.isEnabled()) {
                continue;
            }
            if (adapter.supportsTradingPair(_srcAddress, _destAddress)) {
                return true;
            }
        }

        return false;
    }

    function isValidAdapter(address _adapter) external view returns (bool) {
        return adapters[_adapter] > 0;
    }

    function removeExchangeAdapter(bytes32 _exchangeId) external onlyOwner returns (bool) {
        uint indexToRemove;
        bool included;
        uint i;
        for (i = 0; i < exchanges.length; i++) {
            if (exchanges[i] == _exchangeId) {
                included = true;
                indexToRemove = i;
                break;
            }
        }
        if (!included) return false;
        if (indexToRemove >= exchanges.length) return false;

        for (i = indexToRemove; i < exchanges.length-1; i++) {
            exchanges[i] = exchanges[i+1];
        }
        exchanges.length--;
        return true;
    }
}
