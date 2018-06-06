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
    PriceProviderInterface internal priceProvider;
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
    IndexStatus public indexStatus;
    // Fee
    uint256 pendingOwnerFee;
    uint256 indexManagmentFee;
    uint withdrawedFee;

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
        indexStatus = IndexStatus.Active;
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

    modifier withNoRisk(address _from, address _to, address _tokenAddress, uint256 _value) {
        require(
            !riskProvider.hasRisk(
               _from, _to, _tokenAddress, _value, 0 // Price not required
            ), "The transaction is risky");
        _;
    }

    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value)
      onlyPayloadSize(2*32)
      withNoRisk(msg.sender, _recipient, address(this), _value)
      public returns(bool success) {

        require(balances[msg.sender] >= _value, "Your balance is not enough");
        require(_value > 0, "Value needs to be greater than 0");
        require(indexStatus == IndexStatus.Active, "Index status is not active");

        balances[msg.sender] -= _value;
        balances[_recipient] += _value;
        emit Transfer(msg.sender, _recipient, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value)
      withNoRisk(_from, _to, address(this), _value)
      public returns(bool success){
        require(balances[_from] >= _value, "Your balance is not enough");
        require(allowed[_from][msg.sender] >= _value, "Not enough balance is allowed");
        require(_value > 0, "Value needs to be greater than 0");
        require(indexStatus == IndexStatus.Active, "Index status is not active");

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
    // -------------------------- INVEST --------------------------

 // Minimal 0.1 ETH
    function () public
      withNoRisk(msg.sender, address(this), 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee, msg.value)
      payable {
        uint _fee;
        uint _realBalance;
        uint _realShare;
        uint _sharePrice;

        require(indexStatus == IndexStatus.Active, "Index status is not active");
        require(msg.value >= 10**15, "The minium to invest required is 0.01 ETH");

        (_realBalance,_fee) = calculateFee(msg.value);
        _sharePrice = getPriceInternal(msg.value);
        pendingOwnerFee += _fee;
        _realShare = _realBalance / _sharePrice;
        balances[msg.sender] += _realShare * 10 ** decimals;
        totalSupply += _realShare * 10 ** decimals;
        emit Transfer(owner, msg.sender, _realShare * 10 ** decimals);
        emit BuyIndex(msg.sender, _realShare * 10 ** decimals);
    }

    function calculateFee(uint invest) internal view returns(uint _realBalance,uint _managementFee){
        _managementFee = invest / 100 * indexManagmentFee;
        _realBalance = invest - _managementFee;
    }

    function withdrawFee() public onlyOwner {
       // TODO: Does index need withdrawCycle?
        require(pendingOwnerFee > 0);
        owner.transfer(pendingOwnerFee);
        withdrawedFee += pendingOwnerFee;
        pendingOwnerFee = 0;
    }

   function getPriceInternal(uint _vaule) internal view returns(uint _price) {

        uint _totalVaule = 0;
        uint _expectedRate;
        if(totalSupply == 0){return 10**18;} // 1 Eth

        for (var i = 0; i < indexTokenAddresses.length; i++) {
            erc20Token = ERC20(indexTokenAddresses[i]);
            uint _balance = erc20Token.balanceOf(address(this));
            uint _decimal = erc20Token.decimals();
            if(_balance == 0){continue;}
            (_expectedRate, ) = priceProvider.getRates(indexTokenAddresses[i], 10**_decimal);
            if(_expectedRate == 0){continue;}
            _totalVaule += (_balance * 10**18) / _expectedRate;
        }

        if (_totalVaule == 0){return 10**18;} // 1 Eth

        return ((_totalVaule + address(this).balance - pendingOwnerFee - _vaule) * 10 ** decimals) / totalSupply;
    }

    function getPrice() public view returns(uint _price){
        _price = getPriceInternal(0);
    }

    // -------------------------- PROVIDER --------------------------
    function setPermissionProvider(address _permissionAddress) public onlyOwner {
        permissionProvider = PermissionProviderInterface(_permissionAddress);
    }

    function setPriceProvider(address _priceAddress) public onlyOwner {
        priceProvider = PriceProviderInterface(_priceAddress);
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


    event BuyIndex(
        address indexed _spender,
        uint256 _value
    );
}
