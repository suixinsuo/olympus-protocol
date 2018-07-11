pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";
import "./components/base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "./libs/ERC20Extended.sol";


// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface, ComponentContainer, PausableToken {

    ERC20Extended internal constant ETH = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    // Set component from outside the chain
    function setComponentExternal(string name, address provider) external onlyOwner returns(bool) {
        setComponent(name, provider);
        return true;
    }

    function () public payable {

    }
}
