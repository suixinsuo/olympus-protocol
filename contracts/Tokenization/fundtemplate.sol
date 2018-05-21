pragma solidity ^0.4.23;


import "../permission/PermissionProviderInterface.sol";

contract fundtemplate {

    enum FUNDstatus { Pause, Close , Active }
    
    struct FUND {
        uint id;
        string name;
        string description;
        string category;
        address[] tokenAddresses;
        uint[] weights;
        uint managementfee;
        uint withdrawcycle; //*hours;
        uint deposit;       //押金
        FUNDstatus status;
        //uint follower; 放到另一个 struct 里面
        //uint amount;   放到另一个 struct 里面
        //bytes32 exchangeId;  不指定交易所
    }
    struct FUNDExtend {
        address owner;
        bool riskcontrol;   //default true;
        
    }
    
    FUND          public         _FUND;
    FUNDExtend    public         _FUNDExtend;
    
    function fundtemplate(
        uint _id,
        string _name,
        string _description,
        string _category,
        address[] memory _tokenAddresses,
        uint[] memory _weights,
        uint _withdrawcycle
    )public 
    {
        _FUND.id = _id;
        _FUND.name = _name;
        _FUND.description = _description;
        _FUND.category = _category;
        _FUND.tokenAddresses = _tokenAddresses;
        _FUND.weights = _weights;
        _FUND.status = FUNDstatus.Active;
        _FUND.withdrawcycle = _withdrawcycle;
        _FUNDExtend.owner = tx.origin;
        _FUNDExtend.riskcontrol = true;
    }




}