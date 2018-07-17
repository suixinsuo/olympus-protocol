pragma solidity 0.4.24;

import "../Derivative.sol";
import "../interfaces/IndexInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/RebalanceInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/WhitelistInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../libs/ERC20Extended.sol";
import "../libs/Converter.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/FeeChargerInterface.sol";
import "../interfaces/RiskControlInterface.sol";
import "../interfaces/LockerInterface.sol";


contract OlympusIndex is IndexInterface, Derivative {
    using SafeMath for uint256;


    event ChangeStatus(DerivativeStatus status);
    event Invested(address user, uint amount);
    event Reimbursed(uint amount);
    event RiskEvent(address _sender, address _receiver, address _tokenAddress, uint _amount, uint _rate, bool risky);

    uint public constant DENOMINATOR = 10000;
    uint public constant INITIAL_VALUE =  10**18;
    uint[] public weights;
    uint public accumulatedFee = 0;
    uint public maxTransfers = 10;
    uint public rebalanceDeltaPercentage = 0; // by default, can be 30, means 0.3%.

    modifier checkLength(address[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }

    modifier checkWeights(uint[] _weights) {
        uint totalWeight;
        for (uint i = 0; i < _weights.length; i++) {
            totalWeight += _weights[i];
        }
        require(totalWeight == 100);
        _;
    }

    constructor (
      string _name,
      string _symbol,
      string _description,
      string _category,
      uint _decimals,
      address[] _tokens,
      uint[] _weights)
      public checkLength(_tokens, _weights) checkWeights(_weights) {
        name = _name;
        symbol = _symbol;
        totalSupply_ = 0;
        decimals = _decimals;
        description = _description;
        category = _category;
        version = "1.0";
        fundType = DerivativeType.Index;
        tokens = _tokens;
        weights = _weights;
        status = DerivativeStatus.New;
    }

    // ----------------------------- CONFIG -----------------------------
    function initialize(
        address _componentList,
        uint _initialFundFee,
        uint _rebalanceDeltaPercentage,
        uint _rebalanceIntervalHours,
        uint _buyTokensIntervalHours) 
    external onlyOwner  payable {
        require(status == DerivativeStatus.New);
        require(msg.value > 0); // Require some balance for internal opeations as reimbursable
        require(_componentList != 0x0);
        require(_rebalanceDeltaPercentage <= DENOMINATOR);

        rebalanceDeltaPercentage = _rebalanceDeltaPercentage;
        super.initialize(_componentList);
        bytes32[9] memory names = [MARKET, EXCHANGE, REBALANCE, RISK, WHITELIST, FEE, REIMBURSABLE, WITHDRAW, LOCKER];
        bytes32[] memory nameParameters = new bytes32[](names.length);

        for (uint i = 0; i < names.length; i++) {
            nameParameters[i] = names[i];
        }
        setComponents(
            nameParameters,
            componentList.getLatestComponents(nameParameters)
        );

        // approve component for charging fees.
        approveComponents();

        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_initialFundFee);
        LockerInterface(getComponentByName(LOCKER)).setIntervalHours(REBALANCE, _rebalanceIntervalHours);
        LockerInterface(getComponentByName(LOCKER)).setIntervalHours("BuyTokens", _buyTokensIntervalHours);
        status = DerivativeStatus.Active;

        emit ChangeStatus(status);

        accumulatedFee += msg.value;
    }

    function setIntervalHours(bytes32 _timerName, uint _hours) external onlyOwner{
        LockerInterface(getComponentByName(LOCKER)).setIntervalHours(_timerName,  _hours);
    }
    // Call after you have updated the MARKET provider, not required after initialize
    function registerInNewMarketplace() external onlyOwner returns(bool) {
        require(MarketplaceInterface(getComponentByName(MARKET)).registerProduct());
        return true;
    }

    // Return tokens and weights
    function getTokens() public view returns (address[] _tokens, uint[] _weights) {
        return (tokens, weights);
    }
    // Return tokens and amounts
    function getTokensAndAmounts() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = ERC20Extended(tokens[i]).balanceOf(address(this));
        }
        return (tokens, _amounts);
    }

    function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool) {
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New && _status != DerivativeStatus.Closed);
        require(status != DerivativeStatus.Closed && _status != DerivativeStatus.Closed);

        status = _status;
        emit ChangeStatus(status);
        return true;
    }

    function close() public onlyOwner returns(bool success){
        require(status != DerivativeStatus.New);
        getETHFromTokens(DENOMINATOR); // 100% all the tokens
        status = DerivativeStatus.Closed;
        emit ChangeStatus(status);
        return true;
    }

    // ----------------------------- DERIVATIVE -----------------------------

    function invest() public payable
     whenNotPaused
     whitelisted(WhitelistKeys.Investment)
     withoutRisk(msg.sender, address(this), ETH, msg.value, 1)
     returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
         // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if(totalSupply_ > 0) {
            _sharePrice = getPrice() - ( (msg.value * 10 ** decimals ) / totalSupply_);
         } else {
            _sharePrice = INITIAL_VALUE;
        }

        ChargeableInterface feeManager = ChargeableInterface(getComponentByName(FEE));
        uint fee = feeManager.calculateFee(msg.sender, msg.value);

        uint _investorShare = ( ( (msg.value-fee) * DENOMINATOR) / _sharePrice) * 10 ** decimals;
        _investorShare = _investorShare / DENOMINATOR;

        accumulatedFee += fee;
        balances[msg.sender] += _investorShare;
        totalSupply_ += _investorShare;

        emit Invested(msg.sender, _investorShare);
        return true;
    }

    function getPrice() public view returns(uint)  {
        if(totalSupply_ == 0) {
            return INITIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          ((getAssetsValue() + getETHBalance() ) * 10 ** decimals ) / (totalSupply_),
        );
    }

    function getETHBalance() public view returns(uint){
        return address(this).balance - accumulatedFee;
    }

    function getAssetsValue() public view returns (uint) {
        // TODO cast to OlympusExchangeInterface
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        uint _balance;

        for (uint16 i = 0; i < tokens.length; i++) {

            _balance = ERC20(tokens[i]).balanceOf(address(this));

            if(_balance == 0){continue;}

            (_expectedRate, ) = exchangeProvider.getPrice(ETH, ERC20Extended(tokens[i]), _balance, 0x0);

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

    function withdrawFee(uint amount) external onlyOwner whenNotPaused returns(bool) {
        require(accumulatedFee >= amount);
        accumulatedFee -= amount;
        msg.sender.transfer(amount);
        return true;
    }

    function setManagementFee(uint _fee) external onlyOwner {
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_fee);
    }

    function getManagementFee() external view returns(uint) {
        return ChargeableInterface(getComponentByName(FEE)).getFeePercentage();
    }

    // ----------------------------- WITHDRAW -----------------------------
    function requestWithdraw(uint amount) external
      whenNotPaused
      withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
    {
        WithdrawInterface(getComponentByName(WITHDRAW)).request(msg.sender, amount);
    }

    function setMaxTransfers(uint _maxTransfers) external onlyOwner {
        require(_maxTransfers > 0);
        maxTransfers = _maxTransfers;
    }

    function withdraw() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {

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
            address(_requests[i]).transfer(_eth);
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

    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee -= reimbursedAmount;
        emit Reimbursed(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }

    function tokensWithAmount() public view returns( ERC20Extended[] memory) {
        // First check the length
        uint8 length = 0;
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint8 i = 0; i < tokens.length; i++) {
            _amounts[i] = ERC20Extended(tokens[i]).balanceOf(address(this));
            if(_amounts[i] > 0) {length++;}
        }

        ERC20Extended[] memory _tokensWithAmount = new ERC20Extended[](length);
        // Then create they array
        uint8 index = 0;
        for (uint8 j = 0; j < tokens.length; j++) {
            if(_amounts[j] > 0) {
                _tokensWithAmount[index] = ERC20Extended(tokens[j]);
                index++;
            }
        }
        return _tokensWithAmount;
    }

    function getETHFromTokens(uint _tokenPercentage ) private {
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        uint[] memory _amounts = new uint[](  _tokensToSell.length);
        uint[] memory _sellRates = new uint[]( _tokensToSell.length);
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint8 i = 0; i < _tokensToSell.length; i++) {

            _amounts[i] = (_tokenPercentage * _tokensToSell[i].balanceOf(address(this)) )/DENOMINATOR;
            ( , _sellRates[i] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], 0x0);
            require(!hasRisk(address(this), exchange, address( _tokensToSell[i]), _amounts[i] , 0));
            _tokensToSell[i].approve(exchange,  0);
            _tokensToSell[i].approve(exchange,  _amounts[i]);
        }
        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), 0x0, 0x0));

    }

    // ----------------------------- REBALANCE -----------------------------

    function buyTokens() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {
        LockerInterface(getComponentByName(LOCKER)).checkLockByHours("BuyTokens");
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));


        if(getETHBalance() == 0) {
            reimburse();
            return true;
        }
        uint[] memory _amounts = new uint[](tokens.length);
        uint[] memory _rates = new uint[](tokens.length); // Initialize to 0, making sure any rate is fine
        ERC20Extended[] memory _tokensErc20 = new ERC20Extended[](tokens.length); // Initialize to 0, making sure any rate is fine
        uint ethBalance = getETHBalance();
        uint totalAmount = 0;

        for(uint8 i = 0; i < tokens.length; i++) {
            _amounts[i] = ethBalance * weights[i] / 100;
            _tokensErc20[i] = ERC20Extended(tokens[i]);
            (, _rates[i] ) = exchange.getPrice(ETH,  _tokensErc20[i],  _amounts[i], 0x0);
            totalAmount += _amounts[i];
        }

        require(exchange.buyTokens.value(totalAmount)(_tokensErc20, _amounts, _rates, address(this), 0x0, 0x0));

        reimburse();
        return true;
    }

    function rebalance() public onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns (bool success) {
        LockerInterface(getComponentByName(LOCKER)).checkLockByHours(REBALANCE);
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        RebalanceInterface rebalanceProvider = RebalanceInterface(getComponentByName(REBALANCE));
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        address[] memory tokensToSell;
        uint[] memory amountsToSell;
        address[] memory tokensToBuy;
        uint[] memory amountsToBuy;
        uint8 i;
        uint ETHBalanceBefore = address(this).balance;

        (tokensToSell, amountsToSell, tokensToBuy, amountsToBuy,) = rebalanceProvider.rebalanceGetTokensToSellAndBuy(rebalanceDeltaPercentage);
        // Sell Tokens
        for (i = 0; i < tokensToSell.length; i++) {
            ERC20Extended(tokensToSell[i]).approve(address(exchangeProvider), 0);
            ERC20Extended(tokensToSell[i]).approve(address(exchangeProvider), amountsToSell[i]);
            require(exchangeProvider.sellToken(ERC20Extended(tokensToSell[i]), amountsToSell[i], 0, address(this), 0x0, 0x0));

        }

        // Buy Tokens
        amountsToBuy = rebalanceProvider.recalculateTokensToBuyAfterSale(address(this).balance - ETHBalanceBefore, amountsToBuy);
        for (i = 0; i < tokensToBuy.length; i++) {
            require(
                exchangeProvider.buyToken.value(amountsToBuy[i])(ERC20Extended(tokensToBuy[i]), amountsToBuy[i], 0, address(this), 0x0, 0x0)
            );
        }

        reimburse();
        return true;
    }

    // ----------------------------- WHITELIST -----------------------------

    function enableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).enable(uint8(_key));
        return true;
    }

    function disableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).disable(uint8(_key));
        return true;
    }

    function setAllowed(address[] accounts, WhitelistKeys _key,  bool allowed) onlyOwner public returns(bool){
        WhitelistInterface(getComponentByName(WHITELIST)).setAllowed(accounts,uint8(_key), allowed);
        return true;
    }

    function approveComponents() private {
        approveComponent(EXCHANGE);
        approveComponent(WITHDRAW);
        approveComponent(RISK);
        approveComponent(WHITELIST);
        approveComponent(FEE);
        approveComponent(REIMBURSABLE);
        approveComponent(REBALANCE);
    }

    function updateAllComponents() public onlyOwner {
        updateComponent(MARKET);
        updateComponent(EXCHANGE);
        updateComponent(WITHDRAW);
        updateComponent(RISK);
        updateComponent(WHITELIST);
        updateComponent(FEE);
        updateComponent(REBALANCE);
        updateComponent(REIMBURSABLE);
    }

}
