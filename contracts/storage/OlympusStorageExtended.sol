pragma solidity ^0.4.19;

import "../libs/SafeMath.sol";
import "../libs/strings.sol";
import "../libs/Ownable.sol";
import "../libs/Converter.sol";
import "./OlympusStorageExtendedInterface.sol";
import "../permission/PermissionProviderInterface.sol";
import { TypeDefinitions as TD } from "../libs/Provider.sol";

contract OlympusStorageExtended is OlympusStorageExtendedInterface {
    using strings for *;
    using SafeMath for uint256;

    mapping(string => mapping(bytes32 => bytes32)) private orderExtraData;

    PermissionProviderInterface internal permissionProvider;

    modifier onlyStorage() {
        require(permissionProvider.has(msg.sender, TD.ROLE_STORAGE));
        _;
    }

    function OlympusStorageExtended(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    function setCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key, bytes32 value) external onlyStorage returns(bool success) {
        orderExtraData[getAccessor(dataKind, objectId)][key] = value;
        return true;
    }

    function getCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key) external view returns(bytes32 result) {
        return orderExtraData[getAccessor(dataKind, objectId)][key];
    }

    function getAccessor(bytes32 dataKind, uint id) private pure returns(string accessor) {
        return Converter.bytes32ToString(dataKind).toSlice().concat(Converter.bytes32ToString(bytes32(id)).toSlice());
    }
}
