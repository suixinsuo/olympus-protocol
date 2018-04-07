pragma solidity ^0.4.17;

contract ExchangeAdapterBase {
    
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