pragma solidity 0.4.24;

import "./Interfaces.sol";


contract ExchangeAdapterManager {

    mapping(bytes32 => IExchangeAdapter) public exchangeAdapters;
    bytes32[] public exchanges;
    uint private genExchangeId = 1000;
    mapping(address=>uint) private adapters;

    constructor () public {
      // TODO
    }

    event AddedExchange(bytes32 id);

    function addExchange(bytes32 name, address adapter)
    external /* TODO modifier */ returns(bool) {
        require(adapter != 0x0);
        bytes32 id = keccak256(abi.encodePacked(genExchangeId++));
        require(IExchangeAdapter(adapter).addExchange(id, name));
        exchanges.push(id);
        exchangeAdapters[id] = IExchangeAdapter(adapter);
        adapters[adapter]++;

        emit AddedExchange(id);
        return true;
    }

    function getExchanges() external view returns(bytes32[]) {
        return exchanges;
    }

    function getExchangeInfo(bytes32 id)
    external view returns(bytes32 name, bool status) {
        IExchangeAdapter adapter = exchangeAdapters[id];
        require(address(adapter) != 0x0);

        return adapter.getExchange(id);
    }

    function getExchangeAdapter(bytes32 id)
    external view returns(address)
    {
        return address(exchangeAdapters[id]);
    }

    /// >0  : found exchangeId
    /// ==0 : not found
    function pickExchange(ERC20 token, uint amount, uint rate) external view returns (bytes32 exchangeId) {

        int maxRate = -1;
        for (uint i = 0; i < exchanges.length; i++) {

            bytes32 id = exchanges[i];
            IExchangeAdapter adapter = exchangeAdapters[id];
            if (!adapter.isEnabled(id)) {
                continue;
            }

            int _rate = adapter.getRate(id, token, amount);
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

    function checkTokenSupported(ERC20 token) external view returns (bool) {

        for (uint i = 0; i < exchanges.length; i++) {

            bytes32 id = exchanges[i];

            IExchangeAdapter adapter = exchangeAdapters[id];

            if (!adapter.isEnabled(id)) {
                continue;
            }
            if (adapter.getRate(id, token, 0) != 0) {
                return true;
            }
        }
        return false;
    }

    function isValidAdapter(address adapter) external view returns (bool) {
        return adapters[adapter] > 0;
    }
}
