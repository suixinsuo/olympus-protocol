pragma solidity ^0.4.17;
import "../libs/utils.sol";

contract ExchangeAdapterBase is Utils{
    
    enum Status {
        ENABLED, 
        DISABLED
    }

    enum OrderStatus {
        Pending,
        Approved,
        Completed,
        PartiallyCompleted,
        Cancelled,
        Errored
    }

    function getExpectAmount(uint eth, uint rate) internal pure returns(uint){
        // TODO: asume all token decimals is 18
        return calcDstQty(eth, 18, 18, rate);
    }
}