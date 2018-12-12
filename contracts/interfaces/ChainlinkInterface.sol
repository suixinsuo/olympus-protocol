pragma solidity 0.4.24;

contract ChainlinkInterface {
    function requestEthereumPrice(string _jobId, string _currency) public;
    function getCurrentPrice() public view returns(uint256);
    function getLastUpdateTime() public view returns(uint256);

}