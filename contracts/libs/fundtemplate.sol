pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../permission/PermissionProviderInterface.sol";

contract fundtemplate {

    using SafeMath for uint256;

    //Permission Control
    PermissionProviderInterface internal permissionProvider;

    //enum
    enum FUNDstatus { Pause, Close , Active }

    //Modifier

    modifier  OnlyFundOwner() {
        require(tx.origin == _FUNDExtend.owner && _FUNDExtend.owner != 0x0);
        _;
    }

    modifier  OnlyTokenizedOwner() {
        require(msg.sender == owner );
        _;
    }
    modifier  OnlyTokenizedandFundOwner() {
        require(msg.sender == owner && tx.origin == _FUNDExtend.owner);
        _;
    }

    //struct 
    struct _Lock{
        uint locktime;
        uint unlocktime;
    }
    
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

    
    //Costant
    uint    public Managementfee;
    uint256 public totalSupply;
    string public name;
    uint256 public decimals;
    string public symbol;
    address public owner;
     
    FUND          public         _FUND;
    FUNDExtend    public         _FUNDExtend;
    
    //Maping
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

/////////////////////////////////ERC20 Standard
    function fundtemplate(uint256 _totalSupply, string _symbol, string _name) public {
        decimals = 3;
        symbol = _symbol;
        name = _name;
        owner = msg.sender;
        totalSupply = _totalSupply * (10 ** decimals);
        balances[msg.sender] = totalSupply;
        _FUNDExtend.owner = tx.origin;
        _FUND.status = FUNDstatus.Pause;

    }
	//Fix for short address attack against ERC20
    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length == size + 4);
        _;
    } 
    
    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value) onlyPayloadSize(2*32) public {
        require(balances[msg.sender] >= _value && _value > 0);
        require(PersonalLock[msg.sender].unlocktime < now );
        require(_FUNDExtend.riskcontrol&&(_FUND.status == FUNDstatus.Active));
        if (_recipient == owner) {
            balances[msg.sender] -= _value;
            totalSupply -= _value;
            emit Destroy(msg.sender, _value);
            //GetMoneyBack
        } else {
            balances[msg.sender] -= _value;
            balances[_recipient] += _value;
            emit Transfer(msg.sender, _recipient, _value);
        } 
    }

    function transferFrom(address _from, address _to, uint256 _value) public {
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value && _value > 0);
        require(_FUNDExtend.riskcontrol&&(_FUND.status == FUNDstatus.Active));
        require(PersonalLock[_from].unlocktime < now );
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
    }

    function allowance(address _owner, address _spender) view public returns (uint256) {
        return allowed[_owner][_spender];
    }

/////////////////////////////////Tokenlized
    function fundDetail(
        uint _id,
        string _name,
        string _description,
        string _category,
        address[] memory _tokenAddresses,
        uint[] memory _weights,
        uint _withdrawcycle
    )public OnlyTokenizedandFundOwner returns(bool success)
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
        _FUNDExtend.riskcontrol = true;
        return true;
    }

    function getFundDetail() public view returns(
        address _owner,
        string _name,
        string _symbol,
        uint _totalSupply,
        string _description,
        string _category,
        address[]  _tokenAddresses,
        uint[]  _weights
    )   
    {
        _name = _FUND.name;
        _symbol = symbol;
        _owner = _FUNDExtend.owner;
        _totalSupply = totalSupply;
        _description = _FUND.description;
        _category = _FUND.category;
        _tokenAddresses = _FUND.tokenAddresses;
        _weights = _FUND.weights;
    }    

    function getFundKYCDetail() public view returns(bool success) {
        if(_FUNDExtend.riskcontrol&&(_FUND.status == FUNDstatus.Active)){
            return true;
        }
    }

/////////////////////////////////mapping 

    mapping (address => _Lock ) PersonalLock;

    function Lock (uint _hours) public returns(bool success){
        require(balances[tx.origin]> 0 );
        require(PersonalLock[tx.origin].unlocktime < now );
        PersonalLock[tx.origin].locktime = now;
        PersonalLock[tx.origin].unlocktime = now + _hours * 3600 ;
        emit PersonalLocked(tx.origin,PersonalLock[tx.origin].locktime,_hours);
    } 
    //Minimal 0.1 ETH
    function () public payable returns(bool success) {
        uint _fee;
        uint _RealBalance;
        require(getFundKYCDetail());
        require(_FUNDExtend.riskcontrol&&(_FUND.status == FUNDstatus.Active));
        require(msg.value >=  10**17 );
        (_RealBalance,_fee) = calculatefee(msg.value);
        balances[owner] -= _RealBalance/10**15;
        balances[tx.origin] += _RealBalance/10**15;
        Managementfee += _fee;
        emit Transfer(owner, tx.origin, _RealBalance/10**15);
        emit BuyFund(tx.origin, _RealBalance/10**15);
    }

    function calculatefee(uint invest) internal view returns(uint _realbalance,uint _managementfee){
        _managementfee = invest / 100 * _FUND.managementfee;
        _realbalance = invest - _managementfee;
    }
/////////////////////////////////druft 
    function withdrawfee() public OnlyFundOwner {
        require(Managementfee > 0 );
        _FUNDExtend.owner.transfer(Managementfee);
    }
/////////////////////////////////Event 
	//Event which is triggered to log all transfers to this contract's event log
    event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
    );	
	//Event which is triggered whenever an owner approves a new allowance for a spender.
    event Approval(
		address indexed _owner,
		address indexed _spender,
		uint256 _value
    );
    event Destroy(
        address indexed _spender,
        uint256 _value
    );
    event PersonalLocked(
        address indexed _spender,
        uint256 _value,
        uint256 _locktime
    );
    event BuyFund(
        address indexed _spender,
        uint256 _value
    );
}