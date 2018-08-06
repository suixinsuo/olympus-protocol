pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";

interface TokenBrokenInterface {
    // Calculate the balance of a token corresponeding to each investor.
    // The Sender is not expected to be a derivative, but a MappeableDerivative.
    function calculateBalanceByInvestor(ERC20Extended _token) external view returns(uint[]);
}
