pragma solidity ^0.4.18;


contract ExchangeAdapter {
    enum Status {
        ENABLED, 
        DISABLED
    }

    string private _name;
    Status public status;

    function getRate(address token) external view returns(int);
    
    function isEnabled() external view returns (bool success) {
        return status == Status.ENABLED;
    }    

    // >0 : current exchange rate
    // =0 : not support
    // <0 : support but doesn't know rate
    function placeOrder(uint orderId, address src, address dest, uint amount, uint rate, address deposit) 
        external returns(bool success);
        
    function cancelOrder(uint orderId) external returns(bool);   

    function name() public view returns (string) {
        return _name;
    }
}
