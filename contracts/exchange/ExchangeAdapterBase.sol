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
        Cancelled,
        Errored
    }
}