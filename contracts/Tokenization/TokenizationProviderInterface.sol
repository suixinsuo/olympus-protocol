pragma solidity ^0.4.23;

contract TokenizationProviderInterface {
    function createFund(
        string _name,
        string _symbol,
        uint _decimals,
        string _description,
        string _category,
        address[] memory _tokenAddresses,
        uint[] memory _weights,
        uint _withdrawCycle,
        uint _lockTime
    ) public
    ///////WARNING
    //onlyWhitelist
    returns(address FundAddress);

    struct _fundDetail{
        uint fundId;
        string fundName;
        uint createTime;
    }
    mapping (uint => address) public fundIndex;
    mapping (uint => address) public fundOwner;
    mapping (address => _fundDetail) public fundDetail;

    function getFundOwner(uint _fundId) public view returns(address _fundOwner);
    function getFundAddress(uint _fundId) public view returns(address _fundAddress);
}
