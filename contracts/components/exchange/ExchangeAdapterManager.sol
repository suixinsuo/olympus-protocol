pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";


contract ExchangeAdapterManager is Ownable {

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
        pickExchange(_destAddress, _amount, 0, true) :
        pickExchange(_sourceAddress, _amount, 0, false);
        if(exchangeId != 0x0) {
            OlympusExchangeAdapterInterface adapter = exchangeAdapters[exchangeId];
            return adapter.getPrice(_sourceAddress, _destAddress, _amount);
        }
        return(0, 0);
    }

    /// >0  : found exchangeId
    /// ==0 : not found
    function pickExchange(ERC20Extended _token, uint _amount, uint _rate, bool _isBuying) public view returns (bytes32 exchangeId) {

        int maxRate = -1;
        for (uint i = 0; i < exchanges.length; i++) {

            bytes32 id = exchanges[i];
            OlympusExchangeAdapterInterface adapter = exchangeAdapters[id];
            if (!adapter.isEnabled()) {
                continue;
            }
            uint adapterResultRate;
            uint adapterResultSlippage;
            if (_isBuying){
                (adapterResultRate,adapterResultSlippage) = adapter.getPrice(ETH_TOKEN_ADDRESS, _token, _amount);
            } else {
                (adapterResultRate,adapterResultSlippage) = adapter.getPrice(_token, ETH_TOKEN_ADDRESS, _amount);
            }
            int resultRate = int(adapterResultSlippage);


            if (adapterResultRate == 0) { // not support
                continue;
            }

            // TODO: fix it
            if (resultRate < int(_rate)) {
                continue;
            }

            if (resultRate >= maxRate) {
                maxRate = resultRate;
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
}
