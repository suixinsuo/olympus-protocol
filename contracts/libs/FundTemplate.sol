pragma solidity ^0.4.23;
import "./SafeMath.sol";
import "../permission/PermissionProviderInterface.sol";
import "../riskManagement/RiskManagementProviderInterface.sol";
import "../price/PriceProviderInterface.sol";
import "../libs/ERC20.sol";
import "./CoreInterface.sol";


contract FundTemplate {

    using SafeMath for uint256;

    //Permission Control
    PermissionProviderInterface internal permissionProvider;
    //Price
    PriceProviderInterface internal priceProvider;
    // Risk Provider
    RiskManagementProviderInterface internal riskProvider;
    //ERC20
    ERC20 internal erc20Token;
    // CORE
    CoreInterface core;

    //enum
    enum FundStatus { Pause, Close , Active }

    uint public constant DENOMINATOR = 10000;
    uint public  maxWithdrawTransfers = 5;
    string public constant TYPE = 'FUND';
    string public constant version = '0.1';

    struct FUND {
        uint id;
        string name;
        string description;
        string category;
        address[] tokenAddresses;
        uint[] amounts;
        uint managementFee;
        uint withdrawFeeCycle; //*hours;
        uint deposit;       //deposit
        FundStatus status;
        //uint follower;
        //uint amount;
        //bytes32 exchangeId;
    }
    struct FUNDExtend {
        address owner;
        bool limit;
        uint createTime;
        uint lockTime; // For user transfers
        uint dailyFeeRate;
    }
    struct Withdraw {
        address[] userRequests;
        mapping (address => uint)  amountPerUser;
        uint totalWithdrawAmount;
        uint lockHours; // Between fund withdraws
        uint withdrawTimer;
    }
    struct InvestLog{
        uint lastInvestTime;
        uint lastInvestAmount;
        uint balanceAmount;
    }
    //Costant
    uint public pendingOwnerFee;
    uint public withdrawedFee;
    uint256 public totalSupply;
    string public name;
    uint256 public decimals;
    string public symbol;
    address public owner;
    uint public withdrawTime;
    uint public olympusFee;
    address public constant OLYMPUS_WALLET = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;

    FUND          public         _FUND;
    FUNDExtend    public         _FUNDExtend;
    Withdraw      public         _Withdraw;



    //Maping
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;
    mapping(address => bool) tokenIsBroken; // True, is broken, empty, is fine
    mapping (address => InvestLog) investLogs;
    mapping (address => uint256) public tokenIndex;

    //Modifier

    modifier  onlyFundOwner() {
        require(tx.origin == _FUNDExtend.owner && _FUNDExtend.owner != 0x0);
        _;
    }

    modifier  onlyTokenizedOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier  onlyTokenizedAndFundOwner() {
        require(msg.sender == owner && tx.origin == _FUNDExtend.owner);
        _;
    }

    modifier onlyCore() {
         require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }

    modifier withNoRisk(address _from, address _to, address _tokenAddress, uint256 _value) {
        require(
            !riskProvider.hasRisk(
                _from,
                _to,
                _tokenAddress,
                _value,
                0 // Price for now not important
            ),
            "The transaction is risky");
        _;
    }
    //Fix for short address attack against ERC20
    //  https://vessenes.com/the-erc20-short-address-attack-explained/
    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length == size + 4);
        _;
    }
  // Same as modifier but called from the code
   function isFundOwner() public view returns (bool success) {
        return tx.origin == _FUNDExtend.owner && _FUNDExtend.owner != 0x0;
    }

    // -------------------------- ERC20 STANDARD --------------------------
    constructor (string _symbol, string _name, uint _decimals) public {
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
        olympusFee = 0;
        // Withdraw structs
        _Withdraw.totalWithdrawAmount = 0;
    }

    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value)
     onlyPayloadSize(2*32)
     withNoRisk(msg.sender, _recipient, address(this), _value)
     public {
        require(balances[msg.sender] >= _value && _value > 0, "Balance is not enough or is empty");
        require(_FUNDExtend.lockTime < now , "Fund lock time hasn't expired yet");
        require(_FUND.status == FundStatus.Active, "Fund Status is not active");
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

    function transferFrom(address _from, address _to, uint256 _value)
      withNoRisk(_from, _to, address(this), _value)
       public {
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value && _value > 0);
        require(_FUND.status == FundStatus.Active, "Fund Status is not active");
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

    function tokenStatus(address tokenAddress, bool status) public {
        // Status is false, then is broken
        tokenIsBroken[tokenAddress] = (status == false);
    }

    // -------------------------- TOKENIZED --------------------------
    function createFundDetails(
        uint _id,
        string _name,
        string _description,
        string _category,
        uint _withdrawFeeCycle,
        uint _widrawFundCycle

    ) public onlyTokenizedAndFundOwner returns(bool success)
    {
        _FUND.id = _id;
        _FUND.name = _name;
        _FUND.description = _description;
        _FUND.category = _category;
        _FUND.managementFee = 1;
        _FUND.status = FundStatus.Active;
        _FUND.withdrawFeeCycle = _withdrawFeeCycle * 3600 + now;
        withdrawTime = _withdrawFeeCycle;
        _Withdraw.lockHours = _widrawFundCycle;
        _Withdraw.withdrawTimer = _Withdraw.lockHours * 3600 + now;


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
        uint[]  _amounts,
        FundStatus _status
    ){
        _name = _FUND.name;
        _symbol = symbol;
        _owner = _FUNDExtend.owner;
        _totalSupply = totalSupply;
        _description = _FUND.description;
        _category = _FUND.category;
        _tokenAddresses = _FUND.tokenAddresses;
        _amounts = _FUND.amounts;
        _status = _FUND.status;

    }
    // -------------------------- MAPPING --------------------------

    function updateTokens(ERC20[] _tokens) public onlyCore returns(bool success) {

      for (uint i = 0; i < _tokens.length; i++) {
            uint tokenBalance = _tokens[i].balanceOf(this);
             if (tokenBalance > 0) {

                if (tokenIndex[_tokens[i]] == 0) {
                    tokenIndex[_tokens[i]] = _FUND.tokenAddresses.push(_tokens[i]);
                    _FUND.amounts.push(tokenBalance);
                } else {
                  _FUND.amounts[tokenIndex[_tokens[i]] -1] = tokenBalance;
                }
                continue;
            }
            if (tokenIndex[_tokens[i]] != 0) {
                delete _FUND.tokenAddresses[tokenIndex[_tokens[i]] - 1];
                delete _FUND.amounts[tokenIndex[_tokens[i]]];
                tokenIndex[_tokens[i]] = 0;

            }

        }
        return true;
    }

    function sellToken(bytes32 exchangeId, ERC20[] tokens, uint[] amounts, uint[] rates) public onlyCore onlyFundOwner returns (bool success) {
        for(uint i = 0; i < tokens.length; i++) {
            tokens[i].approve(msg.sender, amounts[i]);
        }
        CoreInterface(msg.sender).sellToken(exchangeId, tokens, amounts, rates, address(this));
        return true;
    }

    function buyToken(bytes32 exchangeId, uint ethAmount, ERC20[] tokens, uint[] amounts, uint[] rates)
     public onlyCore onlyFundOwner returns (bool success) {
        uint sum = 0;
        for (uint i = 0; i < amounts.length; i++) {
            sum += amounts[i];
        }
        // Check we have the ethAmount required
        if (sum != ethAmount){ return false; }

        CoreInterface(msg.sender).buyToken.value(ethAmount)(exchangeId, tokens, amounts, rates, address(this));
        return true;
    }

    // -------------------------- MAPPING --------------------------
    function lockFund (uint _hours) public onlyTokenizedAndFundOwner  returns(bool success){
        _FUNDExtend.lockTime += now + _hours * 3600;
        return true;
    }

    // Minimal 0.1 ETH
    function () public
      withNoRisk(msg.sender, address(this), 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee, msg.value)
      payable {
        uint _fee;
        uint _realBalance;
        uint _realShare;
        uint _sharePrice;
        uint _fundPrice;
        require(_FUND.status == FundStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.1 ETH" );
        (_realBalance,_fee) = calculateFee(msg.value);

        // Current value is already added in the balance, reduce it
        if(totalSupply > 0) {
          (_fundPrice,)= getPrice();
          _sharePrice = _fundPrice - ( (msg.value * 10 ** decimals ) / totalSupply);
        } else {
            _sharePrice = 10**18;
        }

        pendingOwnerFee += _fee;
        _realShare = ((_realBalance * DENOMINATOR) / _sharePrice) * ((10 ** decimals) / DENOMINATOR);

        balances[tx.origin] += _realShare;
        totalSupply += _realShare;
        emit Transfer(owner, tx.origin, _realShare);
        emit BuyFund(tx.origin, _realShare);

        //ManagementFee
        investLogs[tx.origin].lastInvestTime = now;
        investLogs[tx.origin].lastInvestAmount += _realShare;
    }

    function calculateFee(uint invest) internal view returns(uint _realBalance,uint _managementFee){
        if (investLogs[tx.origin].lastInvestTime == 0){
            _realBalance = invest;
            _managementFee = 0;
         } else {
            uint _cycle = caculateDate(investLogs[tx.origin].lastInvestTime);
            _managementFee = (investLogs[tx.origin].lastInvestAmount * _cycle * _FUNDExtend.dailyFeeRate)/ DENOMINATOR;
            _realBalance = invest - _managementFee;
        }
    }

    function caculateDate(uint _date) internal view returns(uint _days){
        uint _day = (now - _date) / (60 * 60 * 24);
        if(_day == 0) {return 1;}
        return _day;
    }

    function getPrice() public view returns(uint _price, uint _totalTokensValue){
        uint _expectedRate;
        _totalTokensValue = 0;

        if(totalSupply == 0){return(10**18,0);} // 1 Eth

        for (uint16 i = 0; i < _FUND.tokenAddresses.length; i++) {
            erc20Token = ERC20(_FUND.tokenAddresses[i]);

            uint _balance = erc20Token.balanceOf(address(this));
            uint _decimal = erc20Token.decimals();
            if(_balance == 0){continue;}
            (_expectedRate, ) = priceProvider.getRates(_FUND.tokenAddresses[i], 10**_decimal);
            if(_expectedRate == 0){continue;}
            _totalTokensValue += (_balance * 10**18) / _expectedRate;
        }
         // Total Value in ETH among its tokens + ETH - Fee - new added value
        return (
          ((_totalTokensValue + address(this).balance - pendingOwnerFee) * 10 ** decimals ) / totalSupply,
          _totalTokensValue
        );
    }

    // -------------------------- WITHDRAW --------------------------

    function getFundWithDrawDetails() onlyTokenizedAndFundOwner public view returns(
        uint _totalWithdrawAmount,
        uint _lockHours,
        uint _withdrawTimer,
        address[] _userRequests
    )
    {
        _totalWithdrawAmount = _Withdraw.totalWithdrawAmount;
        _lockHours = _Withdraw.lockHours;
        _withdrawTimer = _Withdraw.withdrawTimer;
        _userRequests = _Withdraw.userRequests;
    }

    function withdrawBalanceOf(address _investor) view public returns (uint) {
        return _Withdraw.amountPerUser[_investor];
    }

    function withdrawRequest(uint256 amount) public returns (uint) {
        require(totalSupply >= _Withdraw.totalWithdrawAmount + amount, "Not withdraw more than allowed quantity" );
        require(balances[msg.sender] >= amount + _Withdraw.amountPerUser[msg.sender]);
        // Add user to the list of requesters
        if ( _Withdraw.amountPerUser[msg.sender] == 0) {
            _Withdraw.userRequests.push(msg.sender);
        }
        _Withdraw.amountPerUser[msg.sender] += amount;
        _Withdraw.totalWithdrawAmount += amount;
        return  _Withdraw.amountPerUser[msg.sender];
    }

    function withdraw() public returns(bool) {
        require(_Withdraw.withdrawTimer <= now);
        require(core != address(0));
        if(_Withdraw.userRequests.length == 0) {return true;}
        // Initial values must stay constant through all the widthdraw
        uint _fundTokenPrice;
        uint _totalTokensValue;
        uint[] memory _initialTokensBalance;
        _Withdraw.withdrawTimer = _Withdraw.lockHours * 3600 + now;
        uint _initialEthBalance = address(this).balance;
        uint _initialTotalToWithdraw =   _Withdraw.totalWithdrawAmount;
        (_fundTokenPrice, _totalTokensValue) = getPrice();
        _initialTokensBalance = getTokensBalance();

        // User request 1000 fund to be return from 5000 supply (20%) total value 2 ETH
        // The loop will handle maxWithdrawTransfers , after complete element of the investors array becomes 0x00
        uint _transfersCounter = 0;
        for (uint8 _investorIndex = 0; _transfersCounter < maxWithdrawTransfers && _investorIndex < _Withdraw.userRequests.length;
          _investorIndex++) {

            // How much eth we require to return
            address _investor = _Withdraw.userRequests[_investorIndex];
            if(_investor == address (0)){continue;}

            uint _fundWithdrawAmount = _Withdraw.amountPerUser[_investor];
            if(_fundWithdrawAmount == 0) {
                delete _Withdraw.userRequests[_investorIndex]; // Reset the data
                continue;
            }
            uint _ethToReturn = (_fundWithdrawAmount * _fundTokenPrice) / 10 ** decimals;
            // _fundWithdrawAmount = 1000;  _ethToReturn = 0.4 ETH (20%)

            // How much of the total request belongs to this user.
            // In this case is the only request, so 100% belongs to him
            uint _directEthReturn = (
                ( _fundWithdrawAmount * DENOMINATOR / _initialTotalToWithdraw) *  _initialEthBalance)/ DENOMINATOR;

            // Do we have in the reserve enough to pay him?
            if(_directEthReturn >= _ethToReturn  ) {
                // If in the deposit we have more than 0.4 ETH, return to him
                _investor.transfer(_ethToReturn);
                emit Withdrawed(_investor,_fundWithdrawAmount,_fundTokenPrice,  _ethToReturn, 0);
            } else {
                // In de deposit we have 0.2, we deliver to him this quantity.
                _investor.transfer(_directEthReturn);
                // Other 0.2, return from tokens. 0.2 represents 10% of the fund value in tokens (no the ETH balance)
                uint _tokenPercentToReturn = (( _ethToReturn - _directEthReturn) * DENOMINATOR) / _totalTokensValue;
                 // Send ETH from Tokens can exchange, or direct amount the ones which cant
                sendETHFromTokens(_investor, _tokenPercentToReturn, _totalTokensValue,_initialTokensBalance);
                sendBrokenTokensToInvestor(_investor, _tokenPercentToReturn, _totalTokensValue,_initialTokensBalance);
                emit Withdrawed(_investor,_fundWithdrawAmount,_fundTokenPrice, _directEthReturn,  _ethToReturn - _directEthReturn);
            }
             // Reset the data
            _Withdraw.amountPerUser[_investor] = 0;
            _Withdraw.totalWithdrawAmount -= _fundWithdrawAmount;
            totalSupply -= _fundWithdrawAmount;
            delete _Withdraw.userRequests[_investorIndex];
            _transfersCounter++;
        }

        return  _Withdraw.totalWithdrawAmount == 0; // If 0 are done, is because all had been already delivered
    }

    function getTokensBalance() public view returns(uint[] memory) {
        uint[] memory _balance = new uint[]( _FUND.tokenAddresses.length);
        for (uint8 _tokenIndex = 0; _tokenIndex < _FUND.tokenAddresses.length; _tokenIndex++) {
            _balance[_tokenIndex] = ERC20(_FUND.tokenAddresses[_tokenIndex]).balanceOf(address(this));
        }
        return _balance;
    }

    function tokensNotBroken() public returns( address[] memory) {
      // First check the length
        uint8 length = 0;
        for (uint8 i = 0; i < _FUND.tokenAddresses.length; i++) {
            if(!tokenIsBroken[_FUND.tokenAddresses[i]]) {
                length++;
            }
        }

        address[] memory tokens = new address[](length);
        // Then create they array
        uint notBrokenIndex = 0;
        for (uint8 j = 0; j < _FUND.tokenAddresses.length; j++) {
            if(!tokenIsBroken[_FUND.tokenAddresses[j]]) {
                tokens[notBrokenIndex] = _FUND.tokenAddresses[j];
                notBrokenIndex++;
            }
        }
        return tokens;
    }

    function sendETHFromTokens(address _investor, uint _tokenPercentage, uint _totalTokensValue , uint[] _initialBalance ) internal {
        address[] memory activeTokens = tokensNotBroken();
        ERC20[] memory _tokensToBuy = new ERC20[]( activeTokens.length);
        uint[] memory _amounts = new uint[](  activeTokens.length);
        uint[] memory _sellRates = new uint[]( activeTokens.length);

        for (uint8 _tokenIndex = 0; _tokenIndex < activeTokens.length; _tokenIndex++) {
            _tokensToBuy[_tokenIndex] = ERC20(activeTokens[_tokenIndex]);

            if(_initialBalance[_tokenIndex] == 0) {continue;}

            ( _sellRates[_tokenIndex], ) = priceProvider.getSellRates(activeTokens[_tokenIndex], 10 ** _tokensToBuy[_tokenIndex].decimals());
            _amounts[_tokenIndex] = (_tokenPercentage *  _initialBalance[_tokenIndex] )/DENOMINATOR;
            _tokensToBuy[_tokenIndex].approve(address(core),  _amounts[_tokenIndex]);


        }
       require(core.sellToken("", _tokensToBuy, _amounts, _sellRates, _investor));
    }

    function sendBrokenTokensToInvestor(address _investor, uint _tokenPercentage, uint _totalTokensValue , uint[] _initialBalance ) internal {
        ERC20 _erc20;
        uint _amount;

        for (uint8 _tokenIndex = 0; _tokenIndex < _FUND.tokenAddresses.length; _tokenIndex++) {
            if(!tokenIsBroken[_FUND.tokenAddresses[_tokenIndex]]) {continue;}

            _erc20 = ERC20(_FUND.tokenAddresses[_tokenIndex]);

            if(_initialBalance[_tokenIndex] == 0) {continue;}

            _amount = (_tokenPercentage * _initialBalance[_tokenIndex])/DENOMINATOR;
            _erc20.transfer(_investor,  _amount);
        }

    }

    // -------------------------- FEES --------------------------
    function getPendingManagmentFee() onlyFundOwner public view returns(uint) {
        return pendingOwnerFee;
    }

    function getWithdrawedFee() onlyFundOwner public view returns(uint) {
        return withdrawedFee;
    }

    function withdrawFee() public onlyFundOwner {
        require(pendingOwnerFee > 0);
        require(_FUND.withdrawFeeCycle <= now, "Withdraw is locked, wait some minutes");
        _FUND.withdrawFeeCycle = withdrawTime * 3600 + now;

        uint olympusAmount = pendingOwnerFee * olympusFee / DENOMINATOR;
        _FUNDExtend.owner.transfer(pendingOwnerFee-olympusAmount);
        OLYMPUS_WALLET.transfer(olympusAmount);
        withdrawedFee += (pendingOwnerFee - olympusAmount);
        pendingOwnerFee = 0;
    }
    // We dont have decimals, managment fee must be already be multiplied for denominator
    function setOlympusFee(uint _olympusFee ) onlyCore public {
        require(_olympusFee > 0);
        require(_olympusFee < DENOMINATOR);
        olympusFee = _olympusFee;
    }

    // We dont have decimals, managment fee must be already be multiplied for denominator
    function setManageFee(uint _manageFee ) onlyFundOwner public {
        require(_manageFee > 0);
        require(_manageFee < DENOMINATOR);
        _FUNDExtend.dailyFeeRate = _manageFee;
    }
    // -------------------------- PROVIDERS --------------------------

    function setPermissionProvider(address _permissionAddress) public onlyTokenizedOwner returns(bool success) {
        permissionProvider = PermissionProviderInterface(_permissionAddress);
        return true;
    }

    function setPriceProvider(address _priceAddress) public onlyTokenizedOwner returns(bool success) {
        priceProvider = PriceProviderInterface(_priceAddress);
        return true;
    }

    function setRiskProvider(address _riskProvider) public onlyTokenizedOwner returns(bool success) {
        riskProvider = RiskManagementProviderInterface(_riskProvider);
        return true;
    }

    function setCore(address _core) public onlyTokenizedOwner returns(bool) {
        core = CoreInterface(_core);
        return true;
    }

    function setMaxWithdrawTransfers(uint8 max) public onlyTokenizedOwner returns(bool) {
        require(max > 0);
        require(max < 100);
        maxWithdrawTransfers = max;
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

    event Withdrawed(address indexed _investor, uint256 fundWithdrawed, uint256 fundPrice, uint256 _amountETH, uint256 _amountInTokens);

    event LogS( string text);
    event LogA( address Address, string text);
    event LogN( uint value, string text);
}
