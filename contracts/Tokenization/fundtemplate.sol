pragma solidity ^0.4.23;

import "../libs/SafeMath.sol";
import "../libs/SimpleERC20Token.sol";
import "../permission/PermissionProviderInterface.sol";

contract fundtemplate is SimpleERC20Token {

    using SafeMath for uint256;

    //enum
    enum FUNDstatus { Pause, Close , Active }
    
    //constant
    
    uint public Managementfee;
    uint public FundBalance;

    //mapping 

    mapping(address => uint) public balances;
    
    //modifier
    modifier  OnlyFundOwner() {
        require(tx.origin == _FUNDExtend.owner );
        _;
    }

    //event

    event BuyIndex(address buyer, uint _buyindex);

    //struct 
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
        _FUND.managementfee = 1;
        _FUND.status = FUNDstatus.Active;
        _FUND.withdrawcycle = _withdrawcycle;
        _FUNDExtend.owner = tx.origin;
        _FUNDExtend.riskcontrol = true;
    }

    function buyFund() public payable returns(bool success) {
        require(_FUND.status == FUNDstatus.Active);
        require(_FUNDExtend.riskcontrol);
        
        Managementfee += msg.value * _FUND.managementfee/100;
        balances[tx.origin] = msg.value - (msg.value * _FUND.managementfee/100);
        FundBalance += sg.value - (msg.value * _FUND.managementfee/100);
        emit BuyIndex(tx.origin, msg.value);
    }

    //FundBack
    function () public {}

    //ManageableInterface

    function ChangeFund()public OnlyFundOwner {}

    function transferOwnership(address _newOwner) OnlyFundOwner returns(bool success){

    }
}