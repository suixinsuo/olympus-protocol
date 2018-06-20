pragma solidity 0.4.24;

import "./interfaces/DerivativeInterface.sol";
import "./components/base/ComponentContainer.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


// Abstract class that implements the common functions to all our derivatives
contract Derivative is DerivativeInterface, ComponentContainer, StandardToken {

    // Set component from outside the chain
    function setProvider(string name, address provider) external onlyOwner returns(bool) {
        setComponent(name, provider);
        return true;
    }

}
