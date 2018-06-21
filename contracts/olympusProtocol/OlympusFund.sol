pragma solidity 0.4.24;

import "../Derivative.sol";
import "../interfaces/FundInterface.sol";
// import "../interfaces/ExchangeInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../interfaces/ReimbursableInterface.sol";


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

    function updateTokens(ERC20[] _updatedTokens) internal returns(bool success) {
        ERC20 tokenAddress;
        for (uint i = 0; i < _updatedTokens.length; i++) {
            tokenAddress = _updatedTokens[i];
            amounts[tokenAddress] = 0;
            // amounts[tokenAddress] = tokenAddress.balanceOf(this); TODO after exchange provider
            if (amounts[tokenAddress] > 0 && !activeTokens[tokenAddress]) {
                tokens.push(tokenAddress);
                activeTokens[tokenAddress] = true;
                continue;
            }
        }
        return true;
    }



    function buyTokens(string  /*_exchangeId*/, ERC20[] _tokens, uint[] /*_amounts*/, uint[]  /*_rates*/) public onlyOwner returns(bool) {
        // TODO in other task
        // uint sum = 0;
        // for (uint i = 0; i < _amounts.length; i++) {
        //     sum += _amounts[i];
        // }
        // // Check we have the ethAmount required
        // if (sum != ethAmount){ return false; }
        // ExchangeProvider exchange = ExchangeProvider(getComponentByName(EXCHANGE));
        // exchange.buyToken.value(ethAmount)(exchangeId, _tokens, _amounts, rates, address(this));
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(string /*_exchangeId*/, ERC20[] _tokens, uint[] _amounts, uint[]  /*_rates*/) public onlyOwner returns (bool) {
        for(uint i = 0; i < tokens.length; i++) {
            _tokens[i].approve(msg.sender, _amounts[i]);
        }
        // TODO in other task
        // ExchangeProvider exchange = ExchangeProvider(getComponentByName(EXCHANGE));
        // exchange.buyToken.sellToken(exchangeId, _tokens, _amounts, rates, address(this));
        updateTokens(_tokens);
        return true;
    }
     // ----------------------------- DERIVATIVE -----------------------------
    event LogN(uint number, string text);

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
        require(_status != DerivativeStatus.New);
        status = _status;
        return true;
    }


    function getPrice() public view returns(uint)  {
        if(totalSupply_ == 0) {
            return INTIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          ((getAssetsValue() + address(this).balance  - accumulatedFee) * 10 ** decimals ) / (totalSupply_),
        );
    }

    function getAssetsValue() internal view returns (uint) {
        // TODO cast to OlympusExchangeInterface
        // address exchangeProvider = getComponentByName(EXCHANGE);
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        ERC20 _erc20;

        if(totalSupply_ == 0) {return INTIAL_VALUE;}  // 1 Eth

        for (uint16 i = 0; i < tokens.length; i++) {

            if(!activeTokens[tokens[i]]) {continue;}

            _erc20 = ERC20(tokens[i]);

            uint _balance = _erc20.balanceOf(address(this));
            // TODO Implement Exchange interface
            // uint _decimal = _erc20.decimals();

            if(_balance == 0){continue;}

            // (_expectedRate, ) = exchangeProvider.getPrice(tokens[i], 10**_decimal);
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
            reimburs();
            return true;
        }

        uint _transfers = 0;
        uint _eth;
        uint tokens;

        if (!withdrawProvider.isInProgress()) {
            withdrawProvider.start();
        }

        if(withdrawProvider.getTotalWithdrawAmount() > address(this).balance) {
            // Sell tokens
        }

        for(uint8 i = 0; i < _requests.length && _transfers < maxTransfers ; i++) {

            (_eth, tokens) = withdrawProvider.withdraw(_requests[i]);
            if(tokens == 0) {continue;}

            balances[_requests[i]] -= tokens;
            totalSupply_ -= tokens;
            address(_requests[i]).transfer(_eth);
            _transfers++;
        }

        if(!withdrawProvider.isInProgress()) {
            withdrawProvider.unlock();
        }
        reimburs();
        return !withdrawProvider.isInProgress(); // True if completed
    }

    function withdrawInProgress() external view returns(bool) {
        return  WithdrawInterface(getComponentByName(WITHDRAW)).isInProgress();
    }

    function reimburs() internal {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee -= reimbursedAmount;
        emit Reimbursed(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }

}
