pragma solidity ^0.4.19;

contract OlympusStorageExtendedInterface {
    /*
     * @dev Use this function to set custom extra data for your contract in a key value format
     * @param dataKind The kind of data, e.g. strategy, order, price, exchange
     * @param objectId The id for your kind of data, e.g. the strategyId, the orderId
     * @param key The key which is used to save your data in the key value mapping
     * @param value The value which will be set on the location of the key
     * @return A boolean which returns true if the function executed succesfully
     */
    function setOrderExtra(bytes32 dataKind, uint objectId, string key, string value) public returns(bool success);
    /*
     * @dev Use this function to get custom extra data for your contract by key
     * @param dataKind The kind of data, e.g. strategy, order, price, exchange
     * @param objectId The id for your kind of data, e.g. the strategyId, the orderId
     * @param key The key which is used to lookup your data in the key value mapping
     * @return The result from the key lookup in string format
     */
    function getOrderExtraData(bytes32 dataKind, uint objectId, string key) public view returns(string result);
    /*
     * @dev This function is used internally to get the accessor for the kind of data
     * @param dataKind The kind of data, e.g. strategy, order, price, exchange
     * @param id The id for your kind of data, e.g. the strategyId, the orderId
     * @return A concatenation of the dataKind string and id as string, which can be used as lookup
     */
    function getAccessor(bytes32 dataKind, uint id) private pure returns(string accessor);
    /*
     * @dev This function converts a bytes32 value to string
     * @param value any bytes32 value
     * @return The previous bytes32 string, as a string
     */
    function bytes32ToString(bytes32 value) private pure returns(string result);
}
