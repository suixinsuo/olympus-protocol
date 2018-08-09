pragma solidity 0.4.24;

import "../Derivative.sol";
import "../interfaces/FundInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../interfaces/RiskControlInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../interfaces/WhitelistInterface.sol";
import "../interfaces/StepInterface.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/FeeChargerInterface.sol";
import "../interfaces/LockerInterface.sol";
import "../interfaces/TokenBrokenInterface.sol";
import "../interfaces/MappeableDerivative.sol";

contract OlympusFund is FundInterface, Derivative, MappeableDerivative {
    using SafeMath for uint256;

    // Does not fit in derivative, index out of gas
    bytes32 public constant TOKENBROKEN = "TokenBroken";


    uint public constant DENOMINATOR = 10000;
    uint private freezeTokenPercentage; // Freeze variable for ETH tokens
    uint public constant INITIAL_VALUE =  10**18; // 1 ETH

    mapping(address => uint) public investors;
    mapping(address => uint) public amounts;
    mapping(address => bool) public activeTokens;
    address[] public tokensBroken;
    uint public accumulatedFee = 0;

    // Mappeable
    mapping (address => uint) public activeInvestorIndex; // Starts from 1 (0 is not existing)
    address[] public activeInvestors; // Start in 0

    constructor(
      string _name,
      string _symbol,
      string _description,
      string _category,
      uint _decimals
     ) public {
        name = _name;
        symbol = _symbol;
        category = _category;
        description = _description;
        version = "1.0";
        decimals = _decimals;
        status = DerivativeStatus.New;
        fundType = DerivativeType.Fund;
    }

    // ----------------------------- CONFIG -----------------------------
    // One time call
    function initialize(address _componentList, uint _initialFundFee, uint _withdrawFrequency ) external onlyOwner payable {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
        require(msg.value > 0); // Require some balance for internal opeations as reimbursable

        // Set PausedCycle
        pausedCycle = 365 days;

        super._initialize(_componentList);
        excludedComponents.push(TOKENBROKEN);

        bytes32[10] memory names = [MARKET, EXCHANGE, RISK, WHITELIST, FEE, REIMBURSABLE, WITHDRAW, LOCKER, STEP, TOKENBROKEN];

        for (uint i = 0; i < names.length; i++) {
            updateComponent(names[i]);
        }

        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_initialFundFee);
        LockerInterface(getComponentByName(LOCKER)).setTimeInterval(WITHDRAW, _withdrawFrequency);
        uint[] memory _maxSteps = new uint[](2);
        bytes32[] memory _categories = new bytes32[](2);
        _maxSteps[0] = 10;
        _maxSteps[1] = 5;
        _categories[0] = WITHDRAW;
        _categories[1] = GETETH;
        StepInterface(getComponentByName(STEP)).setMultipleMaxCalls(_categories, _maxSteps);

        status = DerivativeStatus.Active;

        accumulatedFee = accumulatedFee.add(msg.value);
    }

    function getTokens() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = amounts[tokens[i]];
        }
        return (tokens, _amounts);
    }

    // ----------------------------- FUND INTERFACE -----------------------------
    function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
         public onlyOwnerOrWhitelisted(WhitelistKeys.Admin) returns(bool) {
    

         // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _amounts.length; i++) {
            require(
                !hasRisk(address(this), getComponentByName(EXCHANGE), ETH, _amounts[i], _minimumRates[i])
            );
            totalEthRequired = totalEthRequired.add(_amounts[i]);
        }
        require(getETHBalance() >= totalEthRequired);

        if(!OlympusExchangeInterface(getComponentByName(EXCHANGE)).buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId)){
           
            checkBrokenTokens(_tokens);
            
            return false;
        }
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
      public onlyOwnerOrWhitelisted(WhitelistKeys.Admin) returns (bool) {

        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint i = 0; i < tokens.length; i++) {
            require(!hasRisk(address(this), exchange, address(_tokens[i]), _amounts[i], _rates[i]));
            ERC20NoReturn(_tokens[i]).approve(exchange, 0);
            ERC20NoReturn(_tokens[i]).approve(exchange, _amounts[i]);
        }

        if(!exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId)){
            checkBrokenTokens(_tokens);
            return false;
        }
        updateTokens(_tokens);
        return true;
    }
     // ----------------------------- DERIVATIVE -----------------------------

    function invest() public
        payable
        whitelisted(WhitelistKeys.Investment)
        withoutRisk(msg.sender, address(this), ETH, msg.value, 1)
        whenNotPaused
      returns(bool) {
        require(status == DerivativeStatus.Active);
        require(msg.value >= 10**15);
         // Current value is already added in the balance, reduce it
        uint _sharePrice = INITIAL_VALUE;

        // Map investor (do it at starting)
        addInvestor(msg.sender);

        if (totalSupply_ > 0) {
            _sharePrice = getPrice().sub((msg.value.mul(10**decimals)).div(totalSupply_));
        }

        ChargeableInterface feeManager = ChargeableInterface(getComponentByName(FEE));
        uint fee = feeManager.calculateFee(msg.sender, msg.value);
        uint _investorShare = msg.value.sub(fee).mul(10**decimals).div(_sharePrice);

        accumulatedFee = accumulatedFee.add(fee);
        balances[msg.sender] = balances[msg.sender].add(_investorShare);
        totalSupply_ = totalSupply_.add(_investorShare);

        return true;
    }

    function close() public OnlyOwnerOrPausedTimeout returns(bool success) {
        require(status != DerivativeStatus.New);
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();

        if(!getETHFromTokens(DENOMINATOR)){
            reimburse();
            return false;
        }
        status = DerivativeStatus.Closed;
        reimburse();
        return true;
    }

    function getPrice() public view returns(uint) {
        if (totalSupply_ == 0) {
            return INITIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          getAssetsValue().add(getETHBalance()).mul(10**decimals).div(totalSupply_),
        );
    }

    function getETHBalance() public view returns(uint) {
        return address(this).balance.sub(accumulatedFee);
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
            if (_balance == 0) {continue;}

            (_expectedRate, ) = exchangeProvider.getPrice(ETH, ERC20Extended(tokens[i]), _balance, 0x0);

            if (_expectedRate == 0) {continue;}
            _totalTokensValue = _totalTokensValue.add(_balance.mul(10**18).div(_expectedRate));
        }
        return _totalTokensValue;
    }

    // ----------------------------- FEES  -----------------------------
    // Owner can send ETH to the Index, to perform some task, this eth belongs to him
    // solhint-disable-next-line
    function addOwnerBalance() external payable onlyOwner {
        accumulatedFee = accumulatedFee.add(msg.value);
    }

    // solhint-disable-next-line
    function withdrawFee(uint _amount) external onlyOwner whenNotPaused returns(bool) {
        require(accumulatedFee >= _amount);
        accumulatedFee = accumulatedFee.sub(_amount);
        // Exchange to MOT
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        ERC20Extended MOT = ERC20Extended(FeeChargerInterface(address(exchange)).MOT());
        uint _rate;
        (, _rate ) = exchange.getPrice(ETH, MOT, _amount, 0x0);
        exchange.buyToken.value(_amount)(MOT, _amount, _rate, owner, 0x0);
        return true;
    }

    // solhint-disable-next-line
    function setManagementFee(uint _fee) external onlyOwner {
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_fee);
    }

    // ----------------------------- WITHDRAW -----------------------------
    // solhint-disable-next-line
    function requestWithdraw(uint amount)
        external
        whenNotPaused
        withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
        {
        WithdrawInterface(getComponentByName(WITHDRAW)).request(msg.sender, amount);
    }

    function guaranteeLiquidity(uint tokenBalance) internal returns(bool success){
        StepInterface stepProvider = StepInterface(getComponentByName(STEP));

        if(stepProvider.getStatus(GETETH) == 0) {
            uint _totalETHToReturn = tokenBalance.mul(getPrice()).div(10**decimals);
            if (_totalETHToReturn <= getETHBalance()) {
                return true;
            }
            // tokenPercentToSell must be freeze as class variable
            freezeTokenPercentage = _totalETHToReturn.sub(getETHBalance()).mul(DENOMINATOR).div(getAssetsValue());
        }
        return getETHFromTokens(freezeTokenPercentage);
    }



   // solhint-disable-next-line
    function withdraw()
        external
        onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance)
        whenNotPaused
        returns(bool)
    {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        StepInterface stepProvider = StepInterface(getComponentByName(STEP));

        // Check if there is request
        address[] memory _requests = withdrawProvider.getUserRequests();

        uint _transfers = stepProvider.initializeOrContinue(WITHDRAW);
        uint _eth;
        uint _tokenAmount;
        uint i;

        if (_transfers == 0 && stepProvider.getStatus(GETETH) == 0) {
            LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(WITHDRAW);
            if (_requests.length == 0) {
                reimburse();
                return true;
            }
        }

        if (_transfers == 0){
            if(!guaranteeLiquidity(withdrawProvider.getTotalWithdrawAmount())){
                reimburse();
                return false;
            }
            withdrawProvider.freeze();
        }

        for (i = _transfers; i < _requests.length && stepProvider.goNextStep(WITHDRAW); i++) {

            handleTokensBroken(_requests[i]); // Investors
            (_eth, _tokenAmount) = withdrawProvider.withdraw(_requests[i]);
            if (_tokenAmount == 0) {continue;}

            balances[_requests[i]] = balances[_requests[i]].sub(_tokenAmount);
            totalSupply_ = totalSupply_.sub(_tokenAmount);
            address(_requests[i]).transfer(_eth);
            // Unmap investor (do it at the end)
            removeInvestor(_requests[i]);
        }

        if (i == _requests.length) {
            withdrawProvider.finalize();
            stepProvider.finalize(WITHDRAW);
        }

        reimburse();
        return i == _requests.length; // True if completed
    }


    function handleTokensBroken(address _investor) internal returns(bool) {

        if(tokensBroken.length == 0) {return true;}
        TokenBrokenInterface tokenBrokenProvider = TokenBrokenInterface(getComponentByName(TOKENBROKEN));
        uint[] memory  _tokenBalances = tokenBrokenProvider.tokenBalancesOf(tokensBroken, _investor);
        uint i;
        uint requestPending;
        for(i = 0; i < tokensBroken.length; i++) {
            if(_tokenBalances[i] == 0) {continue;}

            requestPending = tokenBrokenProvider.withdraw(tokensBroken[i], _investor);

            ERC20Extended(tokensBroken[i]).transfer(_investor,_tokenBalances[i]);

            // Remove token broken completed
            if(requestPending == 0) {
                if (tokensBroken.length > 1) { // Swap the last one with the index, remove last element
                    tokensBroken[i] = tokensBroken[tokensBroken.length-1];
                    _tokenBalances[i] = _tokenBalances[tokensBroken.length-1]; // Also change the mapping
                    delete(tokensBroken[tokensBroken.length-1]);
                }
                i--;
                tokensBroken.length--;
            }
        }
        return true;
    }

    // solhint-disable-next-line
    function tokensWithAmount() public view returns( ERC20Extended[] memory) {
        // First check the length
        uint length = 0;
        for (uint i = 0; i < tokens.length; i++) {
            if (amounts[tokens[i]] > 0) {length++;}
        }

        ERC20Extended[] memory _tokensWithAmount = new ERC20Extended[](length);
        // Then create they array
        uint index = 0;
        for (uint j = 0; j < tokens.length; j++) {
            if (amounts[tokens[j]] > 0) {
                _tokensWithAmount[index] = ERC20Extended(tokens[j]);
                index++;
            }
        }
        return _tokensWithAmount;
    }

    // solhint-disable-next-line
    function getETHFromTokens(uint _tokenPercentage) public onlyOwner returns(bool success) {
        StepInterface stepProvider = StepInterface(getComponentByName(STEP));
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        uint currentStep = stepProvider.initializeOrContinue(GETETH);
        uint i; // Current step to tokens.length
        uint arrayLength = stepProvider.getMaxCalls(GETETH);
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();

        if(arrayLength + currentStep >= _tokensToSell.length ) {
            arrayLength = tokens.length - currentStep;
        }

        ERC20Extended[] memory _tokensThisStep = new ERC20Extended[](arrayLength);
        uint[] memory _amounts = new uint[](arrayLength);
        uint[] memory _sellRates = new uint[](arrayLength);

        for(i = currentStep;i < _tokensToSell.length && stepProvider.goNextStep(GETETH); i++){
            uint sellIndex = i.sub(currentStep);
            _tokensThisStep[sellIndex] = _tokensToSell[i];
            _amounts[sellIndex] = _tokenPercentage.mul(_tokensToSell[i].balanceOf(address(this))).div(DENOMINATOR);
            (, _sellRates[sellIndex] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[sellIndex], 0x0);
            require(!hasRisk(address(this), exchange, address(_tokensThisStep[sellIndex]), _amounts[sellIndex], 0));
            ERC20NoReturn(_tokensThisStep[sellIndex]).approve(exchange, 0);
            ERC20NoReturn(_tokensThisStep[sellIndex]).approve(exchange, _amounts[sellIndex]);
        }
        if(!exchange.sellTokens(_tokensThisStep, _amounts, _sellRates, address(this), 0x0)){
                   
            checkBrokenTokens(_tokensThisStep);
            
            return false;
        }
        
        if(i == tokens.length) {
            updateTokens(_tokensToSell); // Must update tokens at the end to keep _tokensToSell freeze
            stepProvider.finalize(GETETH);
            return true;
        }

        return false;
    }

    // ----------------------------- WHITELIST -----------------------------
    // solhint-disable-next-line
    function enableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).enable(uint(_key));
        return true;
    }

    // solhint-disable-next-line
    function disableWhitelist(WhitelistKeys _key) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).disable(uint(_key));
        return true;
    }

    // solhint-disable-next-line
    function setAllowed(address[] accounts, WhitelistKeys _key, bool allowed) public onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setAllowed(accounts, uint(_key), allowed);
        return true;
    }

    function checkBrokenTokens(ERC20Extended[] _tokens) view internal returns(bool success){
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        uint[] memory _failedTimes = new uint[](_tokens.length);
        _failedTimes = exchange.getFailedTradesArray(_tokens);
        for(uint t = 0;t < _tokens.length; t++){
            if((_failedTimes[t]) >= 1 ){
                tokensBroken.push(_tokens[t]);
            }
        }
        return true;
    }


    // solhint-disable-next-line
    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee = accumulatedFee.sub(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }
    function approveComponents() private {
        approveComponent(EXCHANGE);
        approveComponent(WITHDRAW);
        approveComponent(RISK);
        approveComponent(WHITELIST);
        approveComponent(FEE);
        approveComponent(REIMBURSABLE);
    }

    function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success) {
        ERC20 _tokenAddress;
        for (uint i = 0; i < _updatedTokens.length; i++) {
            _tokenAddress = _updatedTokens[i];
            amounts[_tokenAddress] = _tokenAddress.balanceOf(this);
            if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress]) {
                tokens.push(_tokenAddress);
                activeTokens[_tokenAddress] = true;
                continue;
            }
        }
        return true;
    }

    // ----------------------------- MAPPEABLE -----------------------------

    // TODO: Remove after merge with orange
    function setBrokenToken(ERC20Extended _token) external returns(uint[]) {
        TokenBrokenInterface(getComponentByName(TOKENBROKEN)).calculateBalanceByInvestor(_token);
        tokensBroken.push(address(_token));
    }

    function addInvestor(address investor) internal {
        if (activeInvestorIndex[investor] == 0) {
            uint index = activeInvestors.push(investor);
            activeInvestorIndex[investor] = index;
        }
    }
    function removeInvestor(address investor) internal {

        if (balances[investor] > 0) {return;}
        // activeInvestorIndex starts in 1. We iterate until one before the last
        for (uint i = activeInvestorIndex[investor] - 1; i + 1 < activeInvestors.length; i++) {
            activeInvestors[i] = activeInvestors[i+1];
            activeInvestorIndex[activeInvestors[i+1]] -= 1;
        }
        activeInvestorIndex[investor] = 0; // Removed
        activeInvestors.length -= 1;
    }

    function getActiveInvestors() external view returns(address[]) {
        return activeInvestors;
    }
}
