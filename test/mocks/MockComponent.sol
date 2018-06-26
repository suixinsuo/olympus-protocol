pragma solidity 0.4.24;

import "../../contracts/interfaces/ComponentInterface.sol";

contract MockComponent is ComponentInterface {

    string name = "MockComponent";
    constructor(string _version) public {
        version = _version;
    }
}