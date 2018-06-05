pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../permission/PermissionProviderInterface.sol";
import "../riskManagement/RiskManagementProviderInterface.sol";
import "../price/PriceProviderInterface.sol";
import "../libs/ERC20.sol";

contract FundTemplate {

    using SafeMath for uint256;

    //Permission Control
    PermissionProviderInterface internal permissionProvider;
    //Price
    PriceProviderInterface internal priceProvider;
    // Risk Provider
    RiskManagementProvider internal riskProvider;
    //ERC20
    ERC20 internal erc20Token;

    //enum
    enum FundStatus { Pause, Close , Active }


    //struct

    struct FUND {
        uint id;
        string name;
        string description;
        string category;
        address[] tokenAddresses;
        uint[] weights;
        uint managementFee;
        uint withdrawCycle; //*hours;
        uint deposit;       //deposit
        FundStatus status;
        //uint follower;
        //uint amount;
        //bytes32 exchangeId;
    }
    struct FUNDExtend {
        address owner;
        bool riskControl;   //default true;
        bool limit;
        uint createTime;
        uint lockTime;
    }


    //Costant
    uint    public managementFee;
    uint public withdrawedFee;
    uint256 public totalSupply;
    string public name;
    uint256 public decimals;
    string public symbol;
    address public owner;
    uint public withdrawTime;

    FUND          public         _FUND;
    FUNDExtend    public         _FUNDExtend;

    //Maping
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    //Modifier

    modifier  onlyFundOwner() {
        require(tx.origin == _FUNDExtend.owner && _FUNDExtend.owner != 0x0);
        _;
    }

    modifier  onlyTokenizedOwner() {
        require(msg.sender == owner );
        _;
    }
    modifier  onlyTokenizedAndFundOwner() {
        require(msg.sender == owner && tx.origin == _FUNDExtend.owner);
        _;
    }

    modifier withNoRisk() {
        assert(
            !riskProvider.hasRisk(
              tx.origin,
              address(this),
              0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee,
              msg.value,
        1));
        _;
    }

    //Fix for short address attack against ERC20
    //  https://vessenes.com/the-erc20-short-address-attack-explained/
    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length == size + 4);
        _;
    }

/////////////////////////////////ERC20 Standard
    function FundTemplate(string _symbol, string _name,uint _decimals) public {
        require(_decimals >= 0 && _decimals <= 18);
        decimals = _decimals;
        symbol = _symbol;
        name = _name;
        owner = msg.sender;
        _FUNDExtend.owner = tx.origin;
        _FUND.status = FundStatus.Pause;
        totalSupply = 0;
        _FUNDExtend.limit = false;
        _FUNDExtend.createTime = now;
    }

    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value) onlyPayloadSize(2*32) public {
        require(balances[msg.sender] >= _value && _value > 0);
        require(_FUNDExtend.lockTime < now );
        require(_FUNDExtend.riskControl && (_FUND.status == FundStatus.Active));
        if (_recipient == address(this)) {
            balances[msg.sender] -= _value;
            require(totalSupply - _value > 0);
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
        require(_FUNDExtend.riskControl&&(_FUND.status == FundStatus.Active));
        require(_FUNDExtend.lockTime < now );
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

    // -------------------------- TOKENIZED --------------------------
    function createFundDetails(
        uint _id,
        string _name,
        string _description,
        string _category,
        address[] memory _tokenAddresses,
        uint[] memory _weights,
        uint _withdrawCycle
    ) public onlyTokenizedAndFundOwner returns(bool success)
    {
        _FUND.id = _id;
        _FUND.name = _name;
        _FUND.description = _description;
        _FUND.category = _category;
        _FUND.tokenAddresses = _tokenAddresses;
        _FUND.weights = _weights;
        _FUND.managementFee = 1;
        _FUND.status = FundStatus.Active;
        _FUND.withdrawCycle = _withdrawCycle * 3600 + now;
        withdrawTime = _withdrawCycle;
        _FUNDExtend.riskControl = true;
        return true;
    }

    function getFundDetails() public view returns(
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
        if(_FUNDExtend.riskControl && (_FUND.status == FundStatus.Active)){
            return true;
        }
    }

    // -------------------------- MAPPING --------------------------


    function lockFund (uint _hours) public onlyTokenizedAndFundOwner  returns(bool success){
        _FUNDExtend.lockTime += now + _hours * 3600;
        return true;
    }
    //Minimal 0.1 ETH
    function () public withNoRisk payable {
        uint _fee;
        uint _realBalance;
        uint _realShare;
        uint _sharePrice;

        require(getFundKYCDetail());
        require(_FUNDExtend.riskControl&&(_FUND.status == FundStatus.Active));
        require(msg.value >= 10**15 );

        (_realBalance,_fee) = calculateFee(msg.value);
        _sharePrice = getPriceInternal(msg.value);
        managementFee += _fee;
        _realShare = _realBalance / _sharePrice;
        balances[tx.origin] += _realShare * 10 ** decimals;
        totalSupply += balances[tx.origin];

        emit Transfer(owner, tx.origin, balances[tx.origin]);
        emit BuyFund(tx.origin,  balances[tx.origin]);
    }

    function calculateFee(uint invest) internal view returns(uint _realBalance,uint _managementFee){
        _managementFee = invest / 100 * _FUND.managementFee;
        _realBalance = invest - _managementFee;
    }

    // -------------------------- DRUFT --------------------------
    function withdrawfee() public onlyFundOwner {
        require(managementFee > 0 );
        require(_FUND.withdrawCycle < now);
        _FUND.withdrawCycle = withdrawTime * 3600 + now;
        _FUNDExtend.owner.transfer(managementFee);
        withdrawedFee += managementFee;
        managementFee = 0;
    }
    function hasRisk(bool _risk) public onlyTokenizedOwner returns(bool success){
        _FUNDExtend.riskControl = _risk;
    }

    function getPriceInternal(uint _vaule) internal view returns(uint _price){
        uint _totalVaule = 0;
        uint _expectedRate;
        if(totalSupply == 0){
            _price = 10**18;
            return _price; //1eth
        }else{
            for (var i = 0; i < _FUND.tokenAddresses.length; i++) {
                erc20Token = ERC20(_FUND.tokenAddresses[i]);
                uint _balance = erc20Token.balanceOf(address(this));
                uint _decimal = erc20Token.decimals();
                if(_balance == 0){continue;}
                (_expectedRate, ) = priceProvider.getRates(_FUND.tokenAddresses[i], 10**_decimal);
                if(_expectedRate == 0){continue;}
                _totalVaule += ((_balance * 10**18) / _expectedRate) ;
            }
            if (_totalVaule == 0){
                _price = 10**18;
                return _price;
            }else{
                _price = ((_totalVaule + this.balance - managementFee - _vaule)* 10 ** decimals)/totalSupply;
            }
        }
    }
    function getPrice() public view returns(uint _price){
        _price = getPriceInternal(0);
    }

    function setPermissionProvider(address _permissionAddress) public onlyTokenizedOwner  {
        permissionProvider = PermissionProviderInterface(_permissionAddress);
    }

    function setPriceProvider(address _priceAddress) public onlyTokenizedOwner {
        priceProvider = PriceProviderInterface(_priceAddress);
    }

    function setRiskProvider(address _riskProvider) public onlyTokenizedOwner {
        riskProvider = RiskManagementProviderInterface(_riskProvider);
    }

    function changeTokens(address[] _tokens, uint[] _weights) public onlyFundOwner returns(bool success){
        require(_tokens.length == _weights.length);
        _FUND.tokenAddresses = _tokens;
        _FUND.weights = _weights;
        return true;
    }

    // -------------------------- EVENTS --------------------------
 	  // Event which is triggered to log all transfers to this contract's event log
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
        uint256 _lockTime
    );

    event BuyFund(
        address indexed _spender,
        uint256 _value
    );
}
