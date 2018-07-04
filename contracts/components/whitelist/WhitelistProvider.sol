pragma solidity ^0.4.17;

import "../../interfaces/WhitelistInterface.sol";

contract WhitelistProvider is WhitelistInterface {

    string public name = "Whitelist Provider";
    string public description = "Provides whitelist based information";
    string public category="Whitelist";
    string public version="1.0";

    function enable(uint8 _key) external {
        enabled[msg.sender][_key] = true;
    }

    function disable(uint8 _key) external {
        enabled[msg.sender][_key] = false;
    }

    function setAllowed(address[] accounts, uint8 _key,  bool allowed) external returns(bool){

        for(uint i = 0; i < accounts.length; i++) {
            require(accounts[i] != 0x0);
            whitelist[msg.sender][_key][accounts[i]] = allowed;
        }
        return true;
    }

    function isAllowed(uint8 _key, address account) external view returns(bool){
        return enabled[msg.sender][_key] ? whitelist[msg.sender][_key][account] : true;
    }
}

