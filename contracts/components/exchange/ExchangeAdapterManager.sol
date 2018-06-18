pragma solidity 0.4.24;

import "../../libs/Ownable.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";


contract ExchangeAdapterManager is Ownable {

    mapping(bytes32 => OlympusExchangeAdapterInterface) public exchangeAdapters;
    bytes32[] public exchanges;
    uint private genExchangeId = 1000;
    mapping(address=>uint) private adapters;
    ERC20 private constant ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);


    event AddedExchange(bytes32 id);

    function addExchange(bytes32 name, address adapter)
    external onlyOwner returns(bool) {
        require(adapter != 0x0);
        bytes32 id = keccak256(abi.encodePacked(adapter, genExchangeId++));
        require(OlympusExchangeAdapterInterface(adapter).setExchangeDetails(id, name));
        exchanges.push(id);
        exchangeAdapters[id] = OlympusExchangeAdapterInterface(adapter);
        adapters[adapter]++;

        emit AddedExchange(id);
        return true;
    }

    function getExchanges() external view returns(bytes32[]) {
        return exchanges;
    }

    function getExchangeInfo(bytes32 id)
    external view returns(bytes32 name, bool status) {
        OlympusExchangeAdapterInterface adapter = exchangeAdapters[id];
        require(address(adapter) != 0x0);

        return adapter.getExchangeDetails();
    }

    function getExchangeAdapter(bytes32 id)
    external view returns(address)
    {
        return address(exchangeAdapters[id]);
    }

    function getPrice(ERC20 _sourceAddress, ERC20 _destAddress, uint _amount, bytes32 _exchangeId)
        external view returns(uint expectedRate, uint slippageRate) {
        if(_exchangeId != ""){
            return exchangeAdapters[_exchangeId].getPrice(_sourceAddress, _destAddress, _amount);
        }
        for(uint i = 0; i < exchanges.length; i++) {
            bytes32 id = exchanges[i];
            return exchangeAdapters[id].getPrice(_sourceAddress, _destAddress, _amount);
        }
        return(0, 0);
    }

    /// >0  : found exchangeId
    /// ==0 : not found
    function pickExchange(ERC20 token, uint amount, uint rate, bool isBuying) external view returns (bytes32 exchangeId) {

        int maxRate = -1;
        for (uint i = 0; i < exchanges.length; i++) {

            bytes32 id = exchanges[i];
            OlympusExchangeAdapterInterface adapter = exchangeAdapters[id];
            if (!adapter.isEnabled()) {
                continue;
            }
            uint adapterResultRate;
            if (isBuying){
                (,adapterResultRate) = adapter.getPrice(ETH_TOKEN_ADDRESS, token, amount);
            } else {
                (,adapterResultRate) = adapter.getPrice(token, ETH_TOKEN_ADDRESS, amount);
            }
            int _rate = int(adapterResultRate);


            if (_rate == 0) { // not support
                continue;
            }

            // TODO: fix it
            if (_rate < int(rate)) {
                continue;
            }

            if (_rate >= maxRate) {
                maxRate = _rate;
                return id;
            }
        }
        return 0x0;
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
        } else {
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
        }

        return false;
    }

    function isValidAdapter(address adapter) external view returns (bool) {
        return adapters[adapter] > 0;
    }
}
