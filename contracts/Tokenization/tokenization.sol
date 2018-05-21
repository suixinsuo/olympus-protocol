pragma solidity ^0.4.23;

import "../permission/PermissionProviderInterface.sol";
import "./TokenizationIndexInterface.sol";
import "../lib/SafeMath.sol";
import "./fundtemplate.sol"


contract TokenizationIndex is TokenizationIndexInterface  {
    
    using SafeMath for uint256;
    
    //Permission Control
    PermissionProviderInterface internal permissionProvider;


    //modifier
    modifier onlyCore() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }

    modifier onlyWhitelist() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }
    //event


    //status
    uint Fundlength;


    //mapping

    mapping (uint => address) FundIndex;
    mapping (uint => address) FundOwner;

    //function 

    function TokenizationIndex(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    function CreatFUND(
        string _name,
        string _description,
        string _category,
        address[] _tokenAddresses,
        uint[] _weights
    ) public 
    returns (address FundID) 
    {
        require(_checkLength(_tokenAddresses, _weights));
        Fund  = new fundtemplate(_name,_description,_category,_tokenAddresses,_weights);
        FundOwner[Fundlength] = tx.origin;
        fundIndex[Fundlength] = Fund;
        Fundlength += 1;
        return Fund;
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