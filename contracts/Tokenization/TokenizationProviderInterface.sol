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

    function getFundDetails(uint _fundId) public view returns(
        address _owner,
        string _name,
        string _symbol,
        uint _totalSupply,
        string _description,
        string _category,
        address[]  _tokenAddresses,
        uint[]  _weights
    );
    function getFundOwner(uint _fundId) public view returns(address _fundOwner);
    function getFundAddress(uint _fundId) public view returns(address _fundAddress);
}