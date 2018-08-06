pragma solidity 0.4.24;
import "../libs/ERC20Extended.sol";

contract MappeableDerivative is ERC20Extended {
    // Return a list of active investors of the Derivative
    function getActiveInvestors() external view returns(address[]);
}
