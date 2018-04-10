pragma solidity ^0.4.19;


/*
 * @dev This contract, for now, can be used to store simple key pairs.
 * These key pairs which are identifiable by their objectId and dataKind
 * Such as strategy, order, price, etc.
 * The purpose of this interface is that we can store custom data into this contract
 * for any changes in the requirements in the future. Each part of the Olympus core
 * should have options to add custom data to their respective dataType, by using
 * this contract.
 * The functions will always be the same, the implementation of the functions might change
 * So the implementing contracts should be able to modify the configured address of this contract
 * after deployment.
 */
contract OlympusStorageExtendedInterface {
    /*
     * @dev Use this function to set custom extra data for your contract in a key value format
     * @param dataKind The kind of data, e.g. strategy, order, price, exchange
     * @param objectId The id for your kind of data, e.g. the strategyId, the orderId
     * @param key The key which is used to save your data in the key value mapping
     * @param value The value which will be set on the location of the key
     * @return A boolean which returns true if the function executed succesfully
     */
    function setCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key, bytes32 value) external returns(bool success);
    /*
     * @dev Use this function to get custom extra data for your contract by key
     * @param dataKind The kind of data, e.g. strategy, order, price, exchange
     * @param objectId The id for your kind of data, e.g. the strategyId, the orderId
     * @param key The key which is used to lookup your data in the key value mapping
     * @return The result from the key lookup in string format
     */
    function getCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key) external view returns(bytes32 result);
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
