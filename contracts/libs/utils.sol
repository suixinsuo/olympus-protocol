pragma solidity ^0.4.17;

contract Utils {

    uint  constant PRECISION = (10**18);
    uint  constant MAX_DECIMALS = 18;

    function calcDstQty(uint srcQty, uint srcDecimals, uint dstDecimals, uint rate) internal pure returns(uint) {
        if( dstDecimals >= srcDecimals ) {
            require((dstDecimals-srcDecimals) <= MAX_DECIMALS);
            return (srcQty * rate * (10**(dstDecimals-srcDecimals))) / PRECISION;
        } else {
            require((srcDecimals-dstDecimals) <= MAX_DECIMALS);
            return (srcQty * rate) / (PRECISION * (10**(srcDecimals-dstDecimals)));
        }
    }

    // function calcSrcQty(uint dstQty, uint srcDecimals, uint dstDecimals, uint rate) internal pure returns(uint) {
    //     if( srcDecimals >= dstDecimals ) {
    //         require((srcDecimals-dstDecimals) <= MAX_DECIMALS);
    //         return (PRECISION * dstQty * (10**(srcDecimals - dstDecimals))) / rate;
    //     } else {
    //         require((dstDecimals-srcDecimals) <= MAX_DECIMALS);
    //         return (PRECISION * dstQty) / (rate * (10**(dstDecimals - srcDecimals)));
    //     }
    // }
}
