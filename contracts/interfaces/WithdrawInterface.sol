pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WithdrawInterface is ComponentInterface {

    function request(address _requester, uint amount) external returns(bool);
    function withdraw(address _requester) external returns(uint eth, uint tokens);
    function freeze() external;
    // TODO remove in progress
    function isInProgress() external view returns(bool);
    function finalize() external;
    function getUserRequests() external view returns(address[]);
    function getTotalWithdrawAmount() external view returns(uint);

    event WithdrawRequest(address _requester, uint amountOfToken);
    event Withdrawed(address _requester,  uint amountOfToken , uint amountOfEther);
}
