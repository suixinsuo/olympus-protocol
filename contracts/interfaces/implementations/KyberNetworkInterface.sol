pragma solidity 0.4.24;

import "../../libs/ERC20.sol";

contract KyberNetworkInterface {

    function getExpectedRate(ERC20 src, ERC20 dest, uint srcQty)
        external view returns (uint expectedRate, uint slippageRate);

    function trade(
        ERC20 source,
        uint srcAmount,
        ERC20 dest,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId)
        external payable returns(uint);
}
