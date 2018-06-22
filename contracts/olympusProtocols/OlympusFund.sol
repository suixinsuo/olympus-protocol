pragma solidity 0.4.24;

import "../Derivative.sol";
import "../interfaces/FundInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../libs/ERC20Extended.sol";



contract OlympusFund is FundInterface, Derivative {

    uint public constant DENOMINATOR = 100000;
    uint public constant INTIAL_VALUE =  10**18;

    string public constant MARKET = "MarketProvider";
    string public constant EXCHANGE = "ExchangeProvider";
    string public constant WITHDRAW = "WithdrawProvider";
    string public constant RISK = "RiskProvider";
    string public constant WHITELIST = "WhitelistProvider";
    string public constant FEE = "FeeProvider";
    string public constant REIMBURSABLE = "Reimbursable";

    event Reimbursed(uint amount);
    event UpdateToken(address _token, uint amount);

    mapping(address => uint) investors;
    mapping(address => uint) amounts;
    mapping(address => bool) activeTokens;

    uint public maxTransfers = 10;
    uint public accumulatedFee = 0;

    constructor(
      string _name,
      string _symbol,
      string _description,
      uint _decimals
     ) public {

        name = _name;
        symbol = _symbol;
        description = _description;
        version = "1.0";
        decimals = _decimals;
        status = DerivativeStatus.New;
        fundType = DerivativeType.Fund;
    }

    // ----------------------------- CONFIG -----------------------------
    // One time call
    function initialize(
        address _market,
        address _exchange,
        address _withdraw,
        address _risk,
        address _whitelist,
        address _reimbursable,
        address _feeProvider,
        uint _initialFundFee) onlyOwner external payable  {
        require(status == DerivativeStatus.New);
        require (msg.value > 0); // Require some balance for internal opeations as reimbursable

        setComponent(MARKET, _market);
        setComponent(EXCHANGE, _exchange);
        setComponent(WITHDRAW, _withdraw);
        setComponent(RISK, _risk);
        setComponent(WHITELIST, _whitelist);
        setComponent(FEE, _feeProvider);
        setComponent(REIMBURSABLE, _reimbursable);

        MarketplaceInterface(_market).registerProduct();
        ChargeableInterface(_feeProvider).setFeePercentage(_initialFundFee);
        status = DerivativeStatus.Active;

        accumulatedFee += msg.value;
    }

    function getTokens() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = amounts[tokens[i]];
        }
        return (tokens, _amounts);
    }

    // Call after you have updated the MARKET provider, not required after initialize
    function registerInNewMarketplace() external onlyOwner returns(bool) {
        require(MarketplaceInterface(getComponentByName(MARKET)).registerProduct());
        return true;
    }

    // ----------------------------- FUND INTERFACE -----------------------------

    function updateTokens(ERC20Extended[] _updatedTokens) internal returns(bool success) {
        ERC20 _tokenAddress;
        for (uint i = 0; i < _updatedTokens.length; i++) {
            _tokenAddress = _updatedTokens[i];
            amounts[_tokenAddress] = _tokenAddress.balanceOf(this);
            if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress]) {
                tokens.push(_tokenAddress);
                activeTokens[_tokenAddress] = true;
                continue;
            }
            emit UpdateToken(_tokenAddress, amounts[_tokenAddress]);
        }
        return true;
    }


    function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
         public onlyOwner returns(bool) {

        // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _amounts.length; i++) {totalEthRequired += _amounts[i];}
        require(getETHBalance() >= totalEthRequired);


        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        require(exchange.buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId, 0x0));
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates) public onlyOwner returns (bool) {
        for(uint i = 0; i < tokens.length; i++) {
            _tokens[i].approve(msg.sender, _amounts[i]);
        }
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        require(exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId, 0x0));
        updateTokens(_tokens);
        return true;
    }
     // ----------------------------- DERIVATIVE -----------------------------

    function invest() public payable returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.1 ETH");
         // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if(totalSupply_ > 0) {
            _sharePrice = getPrice() - ( (msg.value * 10 ** decimals ) / totalSupply_);
         } else {
            _sharePrice = INTIAL_VALUE;
        }

        ChargeableInterface feeManager = ChargeableInterface(getComponentByName(FEE));
        uint fee = feeManager.calculateFee(msg.sender, msg.value);

        uint _investorShare = ( ( (msg.value-fee) * DENOMINATOR) / _sharePrice) * 10 ** decimals;
        _investorShare = _investorShare / DENOMINATOR;

        accumulatedFee += fee;
        balances[msg.sender] += _investorShare;
        totalSupply_ += _investorShare;

        emit Transfer(msg.sender, owner, msg.value);
        return true;
    }

    function changeStatus(DerivativeStatus _status) public returns(bool) {
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New);
        status = _status;
        return true;
    }

    function getPrice() public view returns(uint)  {
         if(totalSupply_ == 0) {
            return INTIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          ((getAssetsValue() + getETHBalance() ) * 10 ** decimals ) / (totalSupply_),
        );
    }

    function getETHBalance() public view returns(uint){
        return address(this).balance - accumulatedFee;
    }

    function getAssetsValue() internal view returns (uint) {
        // TODO cast to OlympusExchangeInterface
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        uint _balance;

        for (uint16 i = 0; i < tokens.length; i++) {

            _balance = ERC20(tokens[i]).balanceOf(address(this));

            if(_balance == 0){continue;}

            (_expectedRate, ) = exchangeProvider.getPrice( ETH,ERC20Extended(tokens[i]), _balance, 0x0);

            if(_expectedRate == 0){continue;}
            _totalTokensValue += (_balance * 10**18) / _expectedRate;

        }
        return _totalTokensValue;
    }

    // ----------------------------- FEES  -----------------------------
    // Owner can send ETH to the Index, to perform some task, this eth belongs to him
    function addOwnerBalance() external payable onlyOwner {
        accumulatedFee += msg.value;
    }

    function witdrawFee(uint amount) external onlyOwner returns(bool) {
        require(accumulatedFee >= amount);
        msg.sender.transfer(amount);
        accumulatedFee -= amount;
        return true;
    }

    function setManagementFee(uint _fee) external onlyOwner {
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_fee);
    }

    function getManagementFee() external view returns(uint) {
        return ChargeableInterface(getComponentByName(FEE)).getFeePercentage();
    }

    // ----------------------------- WITHDRAW -----------------------------
    function requestWithdraw(uint amount) external {
        WithdrawInterface(getComponentByName(WITHDRAW)).request(msg.sender, amount);
    }

    function setMaxTransfers(uint _maxTransfers) external onlyOwner {
        maxTransfers = _maxTransfers;
    }

    function withdraw() external returns(bool) {

        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        // Check if there is request
        address[] memory _requests = withdrawProvider.getUserRequests();
        if(_requests.length == 0) {
            reimburse();
            return true;
        }

        uint _transfers = 0;
        uint _eth;
        uint tokens;

        if (!withdrawProvider.isInProgress()) {
            withdrawProvider.start();
        }
        uint _totalETHToReturn = ( withdrawProvider.getTotalWithdrawAmount() * getPrice()) / 10 ** decimals;

        if(_totalETHToReturn > getETHBalance()) {
            uint _tokenPercentToSell = (( _totalETHToReturn - getETHBalance()) * DENOMINATOR) / getAssetsValue();
            getETHFromTokens(_tokenPercentToSell);
        }

        for(uint8 i = 0; i < _requests.length && _transfers < maxTransfers ; i++) {

            (_eth, tokens) = withdrawProvider.withdraw(_requests[i]);
            if(tokens == 0) {continue;}

            balances[_requests[i]] -= tokens;
            totalSupply_ -= tokens;
            if(address(this).balance >= _eth) {
                address(_requests[i]).transfer(_eth);
            }
            _transfers++;
        }

        if(!withdrawProvider.isInProgress()) {
            withdrawProvider.unlock();
        }
        reimburse();
        return !withdrawProvider.isInProgress(); // True if completed
    }

    function withdrawInProgress() external view returns(bool) {
        return  WithdrawInterface(getComponentByName(WITHDRAW)).isInProgress();
    }

    function reimburse() internal {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee -= reimbursedAmount;
        emit Reimbursed(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }

    function tokensWithAmount() public view returns( ERC20Extended[] memory) {
      // First check the length
        uint8 length = 0;
        for (uint8 i = 0; i < tokens.length; i++) {
            if(amounts[tokens[i]]> 0) {length++;}
        }

        ERC20Extended[] memory _tokensWithAmount = new ERC20Extended[](length);
        // Then create they array
        uint8 index = 0;
        for (uint8 j = 0; j < tokens.length; j++) {
            if(amounts[tokens[j]] > 0) {
                _tokensWithAmount[index] = ERC20Extended(tokens[j]);
                index++;
            }
        }
        return _tokensWithAmount;
    }


    function getETHFromTokens(uint _tokenPercentage ) internal {
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        uint[] memory _amounts = new uint[](  _tokensToSell.length);
        uint[] memory _sellRates = new uint[]( _tokensToSell.length);
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint8 i = 0; i < _tokensToSell.length; i++) {

            _amounts[i] = (_tokenPercentage * _tokensToSell[i].balanceOf(address(this)) )/DENOMINATOR;
            ( _sellRates[i], ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], "");
            _tokensToSell[i].approve(exchange,  _amounts[i]);
        }

        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), "", 0x0));
    }



    event LogA(address _address, string text);
    event LogN(uint number, string text);
    event LogS(string text);
    event LogU(bool _bool, string text);
}
