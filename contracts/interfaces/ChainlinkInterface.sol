pragma solidity 0.4.24;
import "./ComponentInterface.sol";
contract ChainlinkInterface is ComponentInterface {
    function requestEthereumPrice(string _jobId, string _currency) public;
    function requestEthereumChange(string _jobId, string _currency) public;
    function requestEthereumLastMarket(string _jobId, string _currency) public;
    function getCurrentPrice(string _CurrencyUnit) public view returns(uint256);
    function getLastUpdateTime() public view returns(uint256);
}