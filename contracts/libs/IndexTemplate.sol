pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../permission/PermissionProviderInterface.sol";
import "../price/PriceProviderInterface.sol";
import "../libs/ERC20.sol";
import "../riskManagement/RiskManagementProviderInterface.sol";

contract IndexTemplate {
    using SafeMath for uint256;

    //Permission Control
    PermissionProviderInterface internal permissionProvider;
    //Price
    PriceProviderInterface internal PriceProvider;
    // Risk Provider
    RiskManagementProviderInterface internal riskProvider;
    //ERC20
    ERC20 internal erc20Token;

    //enum
    enum IndexStatus { Paused, Closed , Active }

    uint256 public totalSupply;
    string public name;
    string public description;
    string public category;
    uint256 public decimals;
    string public symbol;
    address public owner;
    address[] public indexTokenAddresses;
    uint8[] public indexTokenWeights;

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    constructor (
        string _symbol, string _name, string _category, string _description,
        uint _decimals, address[] _indexTokenAddresses, uint8[] _indexTokenWeights) public {
        require(_decimals <= 18, "Too many decimals, should be equal to or less than 18");
        decimals = _decimals;
        symbol = _symbol;
        name = _name;
        category = _category;
        description = _description;
        owner = msg.sender;
        indexTokenAddresses = _indexTokenAddresses;
        indexTokenWeights = _indexTokenWeights;
        totalSupply = 0;
    }

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    // Fix for short address attack against ERC20
    // https://vessenes.com/the-erc20-short-address-attack-explained/
    modifier onlyPayloadSize(uint size) {
        require(msg.data.length == size + 4);
        _;
    }

    modifier withNoRisk(address _from, address _to, uint256 _value) {
        assert(
            !riskProvider.hasRisk(
               _from, _to, address(this), _value, 0 // Price not required
            ));
        _;
    }

    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value)
      onlyPayloadSize(2*32)
      withNoRisk(msg.sender,_recipient, _value)
      public returns(bool success) {

        require(balances[msg.sender] >= _value, "Your balance is not enough");
        require(_value > 0, "Value needs to be greater than 0");
        balances[msg.sender] -= _value;
        balances[_recipient] += _value;
        emit Transfer(msg.sender, _recipient, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value)
      withNoRisk(_from,_to, _value)
      public returns(bool success){
        require(balances[_from] >= _value, "Your balance is not enough");
        require(allowed[_from][msg.sender] >= _value, "Not enough balance is allowed");
        require(_value > 0, "Value needs to be greater than 0");
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns(bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) view public returns (uint256) {
        return allowed[_owner][_spender];
    }

    // -------------------------- PROVIDER --------------------------
    function setPermissionProvider(address _permissionAddress) public onlyOwner {
        permissionProvider = PermissionProviderInterface(_permissionAddress);
    }

    function setPriceProvider(address _priceAddress) public onlyOwner {
        PriceProvider = PriceProviderInterface(_priceAddress);
    }

    function setRiskProvider(address _riskProvider) public onlyOwner {
        riskProvider = RiskManagementProviderInterface(_riskProvider);
    }

	  // Event which is triggered to log all transfers to this contract's event log
    event Transfer(
      address indexed _from,
      address indexed _to,
      uint256 _value
    );

  	// Event which is triggered whenever an owner approves a new allowance for a spender.
    event Approval(
      address indexed _owner,
      address indexed _spender,
      uint256 _value
    );
}
