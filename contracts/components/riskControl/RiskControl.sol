pragma solidity 0.4.24;
import "../../interfaces/RiskControlInterface.sol";

contract RiskControl is RiskControlInterface {
    function hasRisk(address /*_sender*/, address /*_receiver*/, address /*_tokenAddress*/, uint /*_amount*/, uint /*_rate*/)
        external view returns(bool isRisky) {
        return false;
    }
}
