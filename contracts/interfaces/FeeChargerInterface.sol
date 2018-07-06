pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";


contract FeeChargerInterface {
    // TODO: change this to mainnet MOT address before deployment.
    // solhint-disable-next-line
    ERC20Extended public MOT = ERC20Extended(0x263c618480DBe35C300D8d5EcDA19bbB986AcaeD);
    // kovan MOT: 0x41Dee9F481a1d2AA74a3f1d0958C1dB6107c686A
}
