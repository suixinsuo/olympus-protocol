
pragma solidity 0.4.24;

import "../../contracts/components/mocks/MockMappeableDerivative.sol";
import "../../contracts/interfaces/TokenBrokenInterface.sol";


contract MockTokenBroken is MockMappeableDerivative {
    TokenBrokenInterface tokenBroken;

    constructor (TokenBrokenInterface _tokenBroken) public {
        tokenBroken = _tokenBroken;
    }

    function setBrokenToken(ERC20Extended _token) external  view returns(uint[]) {
      return tokenBroken.calculateBalanceByInvestor(_token);
    }
}

