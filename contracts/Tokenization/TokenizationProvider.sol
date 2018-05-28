pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../libs/fundtemplate.sol";


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
        _;
    }
    //event
    event TransferOwnerShip(uint _fundindex, address _newowner);

    //status
    uint Fundlength;


    //mapping

    mapping (uint => address) public FundIndex;
    mapping (uint => address) public FundOwner;

    //function 

    function TokenizationIndex(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }


    //Create
    function CreatFUND(
        string _name,
        string _symbol,
        uint _totalSupply,
        string _description,
        string _category,
        address[] memory _tokenAddresses,
        uint[] memory _weights,
        uint _withdrawcycle
    ) public 
    onlyWhitelist
    returns (address FundAddress) 
    {
        require(_checkLength(_tokenAddresses, _weights));
        FundAddress = new fundtemplate(_totalSupply,_symbol,_name);

        //fundtemplate
        fundtemplate  _newfund;
        _newfund = fundtemplate(FundAddress);
        require(_newfund.fundDetail(Fundlength,_name,  _description, _category, _tokenAddresses, _weights, _withdrawcycle));

        FundOwner[Fundlength] = tx.origin;
        FundIndex[Fundlength] = FundAddress;
        Fundlength += 1;
        return FundAddress;
    }

    //Get
    function getFundDetail(uint _fundID) public view returns(
        address _owner,
        string _name,
        string _symbol,
        uint _totalSupply,
        string _description,
        string _category,
        address[]  _tokenAddresses,
        uint[]  _weights
    ){
        fundtemplate  _newfund;
        _newfund = fundtemplate(FundIndex[_fundID]);
        (       ,
            _name,
            _symbol,
            _totalSupply,
            _description,
            _category,
            _tokenAddresses,
            _weights
        )  = _newfund.getFundDetail();
        _owner = FundOwner[_fundID];
    }


    function getFundOwner(uint _fundid) public view returns(address _fundowner) {
        return FundOwner[_fundid];
    }

    function getFundAddress(uint _fundid) public view returns(address _fundaddress) {
        return FundIndex[_fundid];
    }

    function _checkLength(address[] _tokenAddresses,uint[] _weights) internal returns(bool success){
        require(_tokenAddresses.length == _weights.length);
        uint total = 0;
        for (uint i = 0; i < _weights.length; ++i) {
            total += _weights[i];
        }
        return (total <= 100&&total > 0);
    }
}