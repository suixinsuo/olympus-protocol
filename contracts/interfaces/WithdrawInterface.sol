pragma solidity 0.4.24;

import "./ComponentInterface.sol";


contract WithdrawInterface is ComponentInterface {

    function request(address _requester, uint amount) external returns(bool);
    function withdraw(address _requester) external returns(uint);
    function start() external;
    function isInProgress() external view returns(bool);
    function unlock() external;
    function getUserRequests() external view returns(address[]);

    event WithdrawRequest(address _requester, uint amountOfToken);
    event Withdrawed(address _requester, uint amountOfEther);

}
