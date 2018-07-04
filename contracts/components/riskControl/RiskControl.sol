pragma solidity 0.4.24;

import "../../interfaces/RiskControlInterface.sol";
import "../../components/base/FeeCharger.sol";


contract RiskControl is FeeCharger, RiskControlInterface {
    function hasRisk(address /*_sender*/, address /*_receiver*/, address /*_tokenAddress*/, uint /*_amount*/, uint /*_rate*/)
        external returns(bool isRisky) {
        require(payFee(0));

        return false;
    }
}
