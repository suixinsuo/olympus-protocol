pragma solidity 0.4.24;

contract ChainlinkInterface {
    uint256 public currentPrice;
    uint256 public lastUpdateTime;
    function requestEthereumPrice(string _jobId, string _currency) public;
}