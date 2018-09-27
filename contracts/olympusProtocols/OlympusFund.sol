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
    ERC20Extended[] private tokenBrokensERC20Freeze;

    uint public constant INITIAL_VALUE =  10**18; // 1 ETH
    uint public constant INITIAL_FEE = 10**17;
    mapping(address => uint) public investors;
    mapping(address => uint) public amounts;
    mapping(address => bool) public activeTokens;
    address[] public tokensToRelease; // List of tokens brokens with balance to release
    mapping(address=> bool) public isBrokenToken; // Starts from 1

    uint public accumulatedFee = 0;

    // Mappeable
    mapping (address => uint) public activeInvestorIndex; // Starts from 1 (0 is not existing)
    address[] public activeInvestors; // Start in 0

    enum Status { AVAILABLE, WITHDRAWING, PENDING }
    Status public productStatus = Status.AVAILABLE;

    constructor(
      string _name,
      string _symbol,
      string _description,
      string _category,
      uint _decimals
     ) public {
        require(0<=_decimals&&_decimals<=18);
        name = _name;
        symbol = _symbol;
        category = _category;
        description = _description;
        version = "1.1-20180913";
        decimals = _decimals;
        status = DerivativeStatus.New;
        fundType = DerivativeType.Fund;
    }

    // ----------------------------- CONFIG -----------------------------
    // One time call
    function initialize(address _componentList, uint _initialFundFee, uint _withdrawFrequency ) external onlyOwner payable {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
        require(msg.value >= INITIAL_FEE); // Require some balance for internal opeations as reimbursable

        // Set PausedCycle
        pausedCycle = 365 days;

        super._initialize(_componentList);
        excludedComponents[TOKENBROKEN] = true;

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
        require(productStatus == Status.AVAILABLE);
         // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _tokens.length; i++) {
            // Setting amount to 0
            if (isBrokenToken[_tokens[i]]) {
                _amounts[i] = 0;
                continue;
            }
            require(
                !hasRisk(address(this), getComponentByName(EXCHANGE), ETH, _amounts[i], _minimumRates[i])
            );
            totalEthRequired = totalEthRequired.add(_amounts[i]);
        }

        require(getETHBalance() >= totalEthRequired);

        if (!getExchangeInterface()
            .buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId)) {
            checkBrokenTokens(_tokens);
            updateTokens(_tokens);
            return false;
        }

        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
      public onlyOwnerOrWhitelisted(WhitelistKeys.Admin) returns (bool) {
        require(productStatus == Status.AVAILABLE);
        OlympusExchangeInterface exchange = getExchangeInterface();

        for (uint i = 0; i < _tokens.length; i++) {
            // Setting amount to 0 skips the sell
            if (isBrokenToken[_tokens[i]]) {
                _amounts[i] = 0;
                continue;
            }

            require(!hasRisk(address(this), exchange, address(_tokens[i]), _amounts[i], _rates[i]));
            approveExchange(_tokens[i],  _amounts[i]);
        }

        if(!exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId)){
            checkBrokenTokens(_tokens);
            updateTokens(_tokens);
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
        emit Transfer(0x0, msg.sender, _investorShare); // ERC20 Required event

        return true;
    }

    function close() OnlyOwnerOrPausedTimeout public returns(bool success) {
        require(status != DerivativeStatus.New);
        status = DerivativeStatus.Closed;
        return true;
    }

    function sellAllTokensOnClosedFund() onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) public returns (bool) {
        require(status == DerivativeStatus.Closed);
        startGasCalculation();
        bool result = !getETHFromTokens(DENOMINATOR);
        reimburse();
        return result;
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
        OlympusExchangeInterface exchangeProvider = getExchangeInterface();
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        uint _balance;
        uint _decimals;
        ERC20Extended token;

        for (uint i = 0; i < tokens.length; i++) {
            if(isBrokenToken[tokens[i]]) {continue;}

            token = ERC20Extended(tokens[i]);
            _decimals = token.decimals();
            _balance = token.balanceOf(address(this));

            if (_balance == 0) {continue;}
            (_expectedRate, ) = exchangeProvider.getPrice(token, ETH, 10**_decimals, 0x0);
            if (_expectedRate == 0) {continue;}
            _totalTokensValue = _totalTokensValue.add(_balance.mul(_expectedRate).div(10**_decimals));
        }
        return _totalTokensValue;
    }

    // ----------------------------- FEES  -----------------------------
    // Owner can send ETH to the Index, to perform some task, this eth belongs to him
    // solhint-disable-next-line
    function addOwnerBalance() external payable {
        accumulatedFee = accumulatedFee.add(msg.value);
    }

    // solhint-disable-next-line
    function withdrawFee(uint _amount) external onlyOwner whenNotPaused returns(bool) {
        require(_amount > 0);
        require((
            status == DerivativeStatus.Closed && getAssetsValue() == 0) ? // everything is done, take all.
            (_amount <= accumulatedFee)
            :
            (_amount.add(INITIAL_FEE) <= accumulatedFee) // else, the initial fee stays.
        );
        accumulatedFee = accumulatedFee.sub(_amount);
        // Exchange to MOT
        OlympusExchangeInterface exchange = getExchangeInterface();
        ERC20Extended MOT = ERC20Extended(FeeChargerInterface(address(exchange)).MOT());
        uint _rate;
        (, _rate ) = exchange.getPrice(ETH, MOT, _amount, 0x0);

        // fix, this is MOT, so we should require this to be true.
        require(exchange.buyToken.value(_amount)(MOT, _amount, _rate, owner, 0x0));
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
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        withdrawProvider.request(msg.sender, amount);
        if(status == DerivativeStatus.Closed && getAssetsValue() == 0){
            withdrawProvider.freeze();
            handleWithdraw(withdrawProvider, msg.sender);
            withdrawProvider.finalize();
        }
    }

    function guaranteeLiquidity(uint tokenBalance) internal returns(bool success){
        uint _price = getPrice();
        // Case first call
        if(getStatusStep(GETETH) == 0) {
            // Case price is broken while withdrawing
            if(_price == 0) {
                freezeTokenPercentage = DENOMINATOR; // Tokens got broken?
                return getETHFromTokens(freezeTokenPercentage);
            }
           // Case is not required to sell Assets (we will not detect token brokens)
            uint _totalETHToReturn = tokenBalance.mul(_price).div(10**decimals);
            if (_totalETHToReturn <= getETHBalance()) {
                return true;
            }
            // Case is required to sell some assets
            // tokenPercentToSell must be freeze as class variable
            freezeTokenPercentage = _totalETHToReturn.sub(getETHBalance()).mul(DENOMINATOR).div(getAssetsValue());
            return getETHFromTokens(freezeTokenPercentage);
        }
        // Case second call
        return getETHFromTokens(freezeTokenPercentage);
    }


   // solhint-disable-next-line
    function withdraw()
        external
        onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance)
        whenNotPaused
        returns(bool)
    {
        startGasCalculation();
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));

        require(productStatus == Status.AVAILABLE || productStatus == Status.WITHDRAWING);
        productStatus = Status.WITHDRAWING;

        // Check if there is request
        address[] memory _requests = withdrawProvider.getUserRequests();

        uint _transfers = initializeOrContinueStep(WITHDRAW);
        uint i;

        if (_transfers == 0 && getStatusStep(GETETH) == 0) {
            LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(WITHDRAW);
            if (_requests.length == 0) {

                productStatus = Status.AVAILABLE;
                reimburse();
                return true;
            }
        }

        if (_transfers == 0) {
            if(!guaranteeLiquidity(withdrawProvider.getTotalWithdrawAmount())){
                reimburse();
                return false;
            }
            withdrawProvider.freeze();
        }

        for (i = _transfers; i < _requests.length && goNextStep(WITHDRAW); i++) {
            if(!handleWithdraw(withdrawProvider, _requests[i])){ continue; }
        }

        if (i == _requests.length) {
            withdrawProvider.finalize();
            finalizeStep(WITHDRAW);
        }

        productStatus = Status.AVAILABLE;
        reimburse();
        return i == _requests.length; // True if completed
    }

    function handleWithdraw(WithdrawInterface _withdrawProvider, address _investor) private returns (bool) {
        uint _eth;
        uint _tokenAmount;

        releaseTokensBroken(_investor); // Investors
        (_eth, _tokenAmount) = _withdrawProvider.withdraw(_investor);
        if (_tokenAmount == 0) { return false; }

        balances[_investor] = balances[_investor].sub(_tokenAmount);
        totalSupply_ = totalSupply_.sub(_tokenAmount);
        emit Transfer(_investor, 0x0, _tokenAmount); // ERC20 Required event

        // Can be 0 in case all tokens are broken
        if (_eth > 0){
            _transfer(_investor, _eth);
        }
        // Unmap investor (do it at the end)
        removeInvestor(_investor);
        return true;
    }

    function releaseTokensBroken(address _investor) internal returns(bool) {
        if(tokensToRelease.length == 0) {return true;}
        TokenBrokenInterface tokenBrokenProvider = TokenBrokenInterface(getComponentByName(TOKENBROKEN));
        uint[] memory  _tokenBalances = tokenBrokenProvider.tokenBalancesOf(tokensToRelease, _investor);
        uint i;
        uint _requestPending;

        for(i = 0; i < tokensToRelease.length; i++) {
            tokenBrokensERC20Freeze.push(ERC20Extended(tokensToRelease[i])); // Cast
            if(_tokenBalances[i] == 0) {continue;}

            _requestPending = tokenBrokenProvider.withdraw(tokensToRelease[i], _investor);

            tokenTransfer(tokensToRelease[i], _investor, _tokenBalances[i]);

            // Remove token broken completed
            if(_requestPending == 0) {
                tokensToRelease[i] = tokensToRelease[tokensToRelease.length-1];
                _tokenBalances[i] = _tokenBalances[tokensToRelease.length-1]; // Also change the mapping
                delete(tokensToRelease[tokensToRelease.length-1]);
                i--;
                tokensToRelease.length--;
            }
        }
        updateTokens(tokenBrokensERC20Freeze); // Update internal balances
        delete tokenBrokensERC20Freeze; // Reset
        return true;
    }

    // solhint-disable-next-line
    function tokensWithAmount() public view returns( ERC20Extended[] memory) {
        // First check the length
        uint length = 0;
        for (uint i = 0; i < tokens.length; i++) {
            // Has balance and is NOT broken
            if (isBrokenToken[tokens[i]] == false && amounts[tokens[i]] > 0 ) {length++;}
        }

        ERC20Extended[] memory _tokensWithAmount = new ERC20Extended[](length);
        // Then create they array
        uint index = 0;
        for (uint j = 0; j < tokens.length; j++) {
            if (isBrokenToken[tokens[j]] == false && amounts[tokens[j]] > 0) {
                _tokensWithAmount[index] = ERC20Extended(tokens[j]);
                index++;
            }
        }
        return _tokensWithAmount;
    }



    // solhint-disable-next-line
    function getETHFromTokens(uint _tokenPercentage) internal returns(bool success) {
        OlympusExchangeInterface exchange = getExchangeInterface();

        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        if(_tokensToSell.length == 0) {return true;}

        uint currentStep = initializeOrContinueStep(GETETH);
        uint i; // Current step to tokens.length
        uint arrayLength = getNextArrayLength(GETETH, currentStep);

        ERC20Extended[] memory _tokensThisStep = new ERC20Extended[](arrayLength);
        uint[] memory _amounts = new uint[](arrayLength);
        uint[] memory _sellRates = new uint[](arrayLength);

        for(i = currentStep;i < _tokensToSell.length && goNextStep(GETETH); i++) {

            uint sellIndex = i.sub(currentStep);
            _tokensThisStep[sellIndex] = _tokensToSell[i];
            _amounts[sellIndex] = _tokenPercentage.mul(amounts[_tokensToSell[i]]).div(DENOMINATOR);
            (, _sellRates[sellIndex] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[sellIndex], 0x0);
            require(!hasRisk(address(this), exchange, address(_tokensThisStep[sellIndex]), _amounts[sellIndex], 0));
            approveExchange(address(_tokensThisStep[sellIndex]), _amounts[sellIndex]);
        }

        if(!exchange.sellTokens(_tokensThisStep, _amounts, _sellRates, address(this), 0x0)){
            checkBrokenTokens(_tokensThisStep);
        }

        if(i == _tokensToSell.length) {
            updateTokens(_tokensToSell); // Must update tokens at the end to keep _tokensToSell freeze
            finalizeStep(GETETH);
            return true;
        }

        return false;
    }

    function initializeOrContinueStep(bytes32 category) internal returns(uint) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).initializeOrContinue(category);
    }

    function getStatusStep(bytes32 category) internal view returns(uint) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).getStatus(category);
    }

    function finalizeStep(bytes32 category) internal returns(bool) {
        return  StepInterface(ReimbursableInterface(getComponentByName(STEP))).finalize(category);
    }

    function goNextStep(bytes32 category) internal returns(bool) {
        return StepInterface(ReimbursableInterface(getComponentByName(STEP))).goNextStep(category);
    }

    function updateStatusStep(bytes32 category) internal returns(bool) {
        return StepInterface(ReimbursableInterface(getComponentByName(STEP))).updateStatus(category);
    }

    function getNextArrayLength(bytes32 stepCategory, uint currentStep) internal view returns(uint) {
        uint arrayLength = StepInterface(ReimbursableInterface(getComponentByName(STEP))).getMaxCalls(stepCategory);
        if(arrayLength.add(currentStep) >= tokens.length ) {
            arrayLength = tokens.length.sub(currentStep);
        }
        return arrayLength;
    }

    // ----------------------------- WHITELIST -----------------------------
    // solhint-disable-next-line
    function enableWhitelist(WhitelistKeys _key, bool enable) external onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setStatus(uint(_key), enable);
        return true;
    }

    // solhint-disable-next-line
    function setAllowed(address[] accounts, WhitelistKeys _key, bool allowed) public onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setAllowed(accounts, uint(_key), allowed);
        return true;
    }

    function checkBrokenTokens(ERC20Extended[] _tokens) internal {
        TokenBrokenInterface  tokenBrokenProvider = TokenBrokenInterface(getComponentByName(TOKENBROKEN));
        uint[] memory _failedTimes = new uint[](_tokens.length);
        _failedTimes = getExchangeInterface().getFailedTradesArray(_tokens);

        for(uint t = 0;t < _tokens.length; t++) {
             // Is successfull or already broken
            if((_failedTimes[t]) <= 0 || isBrokenToken[_tokens[t]]) {
                continue;
            }
             isBrokenToken[_tokens[t]] = true; // When a token becomes broken, it cant recover
            // I broken, check if has balance to distribute
            if(amounts[_tokens[t]] > 0) {
                tokensToRelease.push(_tokens[t]);
                tokenBrokenProvider.calculateBalanceByInvestor(_tokens[t]);
            }
        }
    }


    // solhint-disable-next-line
    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee = accumulatedFee.sub(reimbursedAmount);
        _transfer(msg.sender, reimbursedAmount);
    }

    function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success) {
        ERC20 _tokenAddress;
        for (uint i = 0; i < _updatedTokens.length; i++) {

            if(_updatedTokens[i] == address(0)){continue;}

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

    function startGasCalculation() internal {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
    }
    // ----------------------------- MAPPEABLE ----------------------------

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
    function approveExchange(address _token, uint amount) internal {
        OlympusExchangeInterface exchange = getExchangeInterface();
        ERC20NoReturn(_token).approve(exchange, 0);
        ERC20NoReturn(_token).approve(exchange, amount);
    }

    function tokenTransfer(address _tokenAddress, address _to, uint _amount) private {
        ERC20NoReturn(_tokenAddress).transfer(_to, _amount);
    }

    function _transfer(address _from, uint _amount) private {
         _from.transfer(_amount);
    }

    function getExchangeInterface() private view returns (OlympusExchangeInterface){
        return OlympusExchangeInterface(getComponentByName(EXCHANGE));
    }

    // // THIS IS FOR TESTING ONLY, DO MEMEMBER TO REMOVE IT WHEN GOING ON PRODUCTION!!!!!
    // function panic() external onlyOwner {
    //     _transfer(owner, address(this).balance);
    //     for (uint i = 0; i < tokens.length; i++) {
    //         tokenTransfer(tokens[i], owner, amounts[tokens[i]]);
    //     }
    // }

}
