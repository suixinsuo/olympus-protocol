pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../libs/FundTemplate.sol";
import "../permission/PermissionProviderInterface.sol";
import "../libs/CoreInterface.sol";

contract TokenizationProvider {

    using SafeMath for uint256;

    //Permission Control
    PermissionProviderInterface internal permissionProvider;


    //modifier
    modifier onlyCore() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }

    modifier onlyWhitelist() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_FUND()));
        //require(permissionProvider.has(msg.sender, permissionProvider.ROLE_FUND()));
        _;
    }
    //event
    event TransferOwnership(uint _fundIndex, address _newOwner);

    //status
    uint fundLength;
    address internal _permissionProviderAddress;
    address internal _priceProvider;
    address internal _riskProvider;

    struct _fundDetail{
        uint fundId;
        string fundName;
        uint createTime;
    }

    //mapping

    mapping (uint => address) public fundIndex;
    mapping (uint => address) public fundOwner;
    mapping (address => _fundDetail) public fundDetail;

    //function

    constructor (address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }


    //Create
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
    returns (address FundAddress)
    {
        require(_checkLength(_tokenAddresses, _weights));
        FundAddress = new FundTemplate(_symbol,_name,_decimals);

        //FundTemplate
        FundTemplate  _newFund;
        _newFund = FundTemplate(FundAddress);
        require(_newFund.createFundDetails(fundLength,_name,  _description, _category, _tokenAddresses, _weights, _withdrawCycle));
        require(_newFund.lockFund(_lockTime));
        fundOwner[fundLength] = tx.origin;
        fundIndex[fundLength] = FundAddress;
        //
        fundDetail[tx.origin].fundId = fundLength;
        fundDetail[tx.origin].fundName = _name;
        fundDetail[tx.origin].createTime = now;
        //
        fundLength += 1;
        address coreAddress = permissionProvider.queryCore();
        require(CoreInterface(coreAddress).addTokenization(FundAddress,0));

        require(_newFund.setPermissionProvider(_permissionProviderAddress));
        require(_newFund.setPriceProvider(_priceProvider));
        require(_newFund.setRiskProvider(_riskProvider));

        return FundAddress;
    }

    //Get
    function getFundDetails(uint _fundId) public view returns(
        address _owner,
        string _name,
        string _symbol,
        uint _totalSupply,
        string _description,
        string _category,
        address[]  _tokenAddresses,
        uint[]  _weights
    ){
        FundTemplate  _newFund;
        _newFund = FundTemplate(fundIndex[_fundId]);
        (       ,
            _name,
            _symbol,
            _totalSupply,
            _description,
            _category,
            _tokenAddresses,
            _weights
        )  = _newFund.getFundDetails();
        _owner = fundOwner[_fundId];
    }


    function setPermissionProvider(address _permissionAddress) public onlyCore() returns(bool success) {
        _permissionProviderAddress = _permissionAddress;
        return true;
    }

    function setPriceProvider(address _priceAddress) public onlyCore() returns(bool success) {
        _priceProvider = _priceAddress;
        return true;
    }

    function setRiskProvider(address _riskAddress) public onlyCore() returns(bool success) {
        _riskProvider = _riskAddress;
        return true;
    }

    function getFundOwner(uint _fundId) public view returns(address _fundOwner) {
        return fundOwner[_fundId];
    }

    function getFundAddress(uint _fundId) public view returns(address _fundAddress) {
        return fundIndex[_fundId];
    }


    function _checkLength(address[] _tokenAddresses,uint[] _weights) internal pure returns(bool success){
        require(_tokenAddresses.length == _weights.length);
        uint total = 0;
        for (uint i = 0; i < _weights.length; ++i) {
            total += _weights[i];
        }
        return (total <= 100 && total > 0);
    }
}
