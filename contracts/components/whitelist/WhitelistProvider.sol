pragma solidity ^0.4.17;

import "../../interfaces/WhitelistInterface.sol";
import "../../components/base/FeeCharger.sol";

contract WhitelistProvider is WhitelistInterface, FeeCharger {

    string public name = "Whitelist Provider";
    string public description = "Provides whitelist based information";
    string public category="Whitelist";
    string public version="1.0";

    function setStatus(uint _key, bool enable) external {
        enabled[msg.sender][_key] = enable;
    }

    function setAllowed(address[] accounts, uint _key,  bool allowed) external returns(bool){
        require(payFee(0));

        for(uint i = 0; i < accounts.length; i++) {
            require(accounts[i] != 0x0);
            whitelist[msg.sender][_key][accounts[i]] = allowed;
        }
        return true;
    }

    function isAllowed(uint _key, address account) external view returns(bool){
        return enabled[msg.sender][_key] ? whitelist[msg.sender][_key][account] : true;
    }
}

