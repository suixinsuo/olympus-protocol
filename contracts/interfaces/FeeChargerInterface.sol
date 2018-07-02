pragma solidity 0.4.24;

import "../libs/ERC20Extended.sol";


contract FeeChargerInterface {
    // TODO: change this to mainnet MOT address before deployment.
    // solhint-disable-next-line
    ERC20Extended public MOT = ERC20Extended(0x41Dee9F481a1d2AA74a3f1d0958C1dB6107c686A);

    // function adjustFeeMode(uint _newMode) external returns (bool);
    // function adjustFeeAmount(uint _newAmount) external returns (bool);
    // function adjustFeePercentage(uint _newPercentage) external returns (bool);
    // function setWalletId(address _newWallet) external returns (bool);
    // function setMotAddress(address _motAddress) external returns (bool);

    // function calculateFee(uint _amount) external view returns (uint amount);
}
