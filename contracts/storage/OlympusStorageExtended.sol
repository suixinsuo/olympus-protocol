pragma solidity ^0.4.19;

import "../libs/SafeMath.sol";
import "../libs/strings.sol";
import "../libs/Ownable.sol";
import "./OlympusStorageExtendedInterface.sol";

contract OlympusStorageExtended is OlympusStorageExtendedInterface, Ownable {
    using strings for *;
    using SafeMath for uint256;

    mapping(string => mapping(bytes32 => bytes32)) private orderExtraData;

    function setCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key, bytes32 value) external returns(bool success) {
        orderExtraData[getAccessor(dataKind, objectId)][key] = value;
        return true;
    }

    function getCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key) external view returns(bytes32 result) {
        return orderExtraData[getAccessor(dataKind, objectId)][key];
    }

    function getAccessor(bytes32 dataKind, uint id) private pure returns(string accessor) {
        return bytes32ToString(dataKind).toSlice().concat(bytes32ToString(bytes32(id)).toSlice());
    }

    function bytes32ToString(bytes32 value) private pure returns(string result) {
        bytes memory bytesString = new bytes(32);
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(value) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[j] = char;
            }
        }
        return string(bytesString);
    }
}
