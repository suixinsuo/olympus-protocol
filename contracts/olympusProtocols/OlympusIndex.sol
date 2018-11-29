pragma solidity 0.4.24;

import "../Derivative.sol";
import "../interfaces/IndexInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/RebalanceInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/WhitelistInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/StepInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../interfaces/ReimbursableInterface.sol";
import "../libs/ERC20Extended.sol";
import "../libs/Converter.sol";
import "../libs/ERC20NoReturn.sol";
import "../interfaces/FeeChargerInterface.sol";
import "../interfaces/LockerInterface.sol";
import "../interfaces/StepInterface.sol";


contract OlympusIndex is IndexInterface, Derivative {
    using SafeMath for uint256;

    bytes32 public constant BUYTOKENS = "BuyTokens";
    enum Status { AVAILABLE, WITHDRAWING, REBALANCING, BUYING, SELLINGTOKENS }
    Status public productStatus = Status.AVAILABLE;
    // event ChangeStatus(DerivativeStatus status);

    uint public constant INITIAL_VALUE =  10**18;
    uint public constant INITIAL_FEE = 10**17;
    uint public constant TOKEN_DENOMINATOR = 10**18; // Apply % to a denominator, 18 is the minimum highetst precision required
    uint[] public weights;
    uint public accumulatedFee = 0;
    uint public rebalanceDeltaPercentage = 0; // by default, can be 30, means 0.3%.
    uint public rebalanceReceivedETHAmountFromSale;
    uint public freezeBalance; // For operations (Buy tokens and sellTokens)
    ERC20Extended[]  freezeTokens;
    enum RebalancePhases { Initial, SellTokens, BuyTokens }

    constructor (
      string _name,
      string _symbol,
      string _description,
      bytes32 _category,
      uint _decimals,
      address[] _tokens,
      uint[] _weights)
      public {
        require(0<=_decimals&&_decimals<=18);
        require(_tokens.length == _weights.length);
        uint _totalWeight;
        uint i;

        for (i = 0; i < _weights.length; i++) {
            _totalWeight = _totalWeight.add(_weights[i]);
            // Check all tokens are ERC20Extended
            ERC20Extended(_tokens[i]).balanceOf(address(this));
            require( ERC20Extended(_tokens[i]).decimals() <= 18);
        }
        require(_totalWeight == 100);

        name = _name;
        symbol = _symbol;
        totalSupply_ = 0;
        decimals = _decimals;
        description = _description;
        category = _category;
        version = "1.1-20181120";
        fundType = DerivativeType.Index;
        tokens = _tokens;
        weights = _weights;
        status = DerivativeStatus.New;


    }

    // ----------------------------- CONFIG -----------------------------
    // solhint-disable-next-line
    function initialize(
        address _componentList,
        uint _initialFundFee,
        uint _rebalanceDeltaPercentage
   )
   public onlyOwner payable {
        require(status == DerivativeStatus.New);
        require(msg.value >= INITIAL_FEE); // Require some balance for internal opeations as reimbursable. 0.1ETH
        require(_componentList != 0x0);
        require(_rebalanceDeltaPercentage <= (10 ** decimals));

        pausedCycle = 365 days;

        rebalanceDeltaPercentage = _rebalanceDeltaPercentage;
        super._initialize(_componentList);
        bytes32[9] memory names = [
            MARKET, EXCHANGE, REBALANCE, WHITELIST, FEE, REIMBURSABLE, WITHDRAW, LOCKER, STEP
        ];

        for (uint i = 0; i < names.length; i++) {
            updateComponent(names[i]);
        }

        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
        setManagementFee(_initialFundFee);

        uint[] memory _maxSteps = new uint[](4);
        bytes32[] memory _categories = new bytes32[](4);
        _maxSteps[0] = 3;
        _maxSteps[1] = 10;
        _maxSteps[2] = 5;
        _maxSteps[3] = 3;

        _categories[0] = REBALANCE;
        _categories[1] = WITHDRAW;
        _categories[2] = BUYTOKENS;
        _categories[3] = GETETH;

        StepInterface(getComponentByName(STEP)).setMultipleMaxCalls(_categories, _maxSteps);
        status = DerivativeStatus.Active;

        // emit ChangeStatus(status);

        accumulatedFee = accumulatedFee.add(msg.value);
    }


    // Return tokens and weights
    // solhint-disable-next-line
    function getTokens() public view returns (address[] _tokens, uint[] _weights) {
        return (tokens, weights);
    }

    // solhint-disable-next-line
    function close() OnlyOwnerOrPausedTimeout public returns(bool success) {
        require(status != DerivativeStatus.New);
        require(productStatus == Status.AVAILABLE);

        status = DerivativeStatus.Closed;
        return true;
    }

    function sellAllTokensOnClosedFund() onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) public returns (bool) {
        require(status == DerivativeStatus.Closed );
        require(productStatus == Status.AVAILABLE || productStatus == Status.SELLINGTOKENS);
        startGasCalculation();
        productStatus = Status.SELLINGTOKENS;
        bool result = getETHFromTokens(TOKEN_DENOMINATOR);
        if(result) {
            productStatus = Status.AVAILABLE;
        }
        reimburse();
        return result;
    }
    // ----------------------------- DERIVATIVE -----------------------------
    // solhint-disable-next-line
    function invest() public payable
     whenNotPaused
     whitelisted(WhitelistKeys.Investment)
      returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
         // Current value is already added in the balance, reduce it
        uint _sharePrice  = INITIAL_VALUE;

        if (totalSupply_ > 0) {
            _sharePrice = getPrice().sub((msg.value.mul(10 ** decimals)).div(totalSupply_));
        }

        uint fee =  ChargeableInterface(getComponentByName(FEE)).calculateFee(msg.sender, msg.value);
        uint _investorShare = (msg.value.sub(fee)).mul(10 ** decimals).div(_sharePrice);

        accumulatedFee = accumulatedFee.add(fee);
        balances[msg.sender] = balances[msg.sender].add(_investorShare);
        totalSupply_ = totalSupply_.add(_investorShare);

        // emit Invested(msg.sender, _investorShare);
        emit Transfer(0x0, msg.sender, _investorShare); // ERC20 Required event
        return true;
    }

    function getPrice() public view returns(uint) {
        if (totalSupply_ == 0) {
            return INITIAL_VALUE;
        }
        uint valueETH = getAssetsValue().add(getETHBalance()).mul(10 ** decimals);
        // Total Value in ETH among its tokens + ETH new added value
        return valueETH.div(totalSupply_);

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
        uint _decimals;
        ERC20Extended token;

        for (uint i = 0; i < tokens.length; i++) {
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
        require(_amount > 0 );
        require((
            status == DerivativeStatus.Closed && getAssetsValue() == 0 && getWithdrawAmount() == 0 ) ? // everything is done, take all.
            (_amount <= accumulatedFee)
            :
            (_amount.add(INITIAL_FEE) <= accumulatedFee) // else, the initial fee stays.
        );
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
    function setManagementFee(uint _fee) public onlyOwner {
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_fee);
    }

    // ----------------------------- WITHDRAW -----------------------------
    // solhint-disable-next-line
    function requestWithdraw(uint amount) external
      whenNotPaused
     {
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        withdrawProvider.request(msg.sender, amount);
        if(status == DerivativeStatus.Closed && getAssetsValue() == 0 && getWithdrawAmount() == amount) {
            withdrawProvider.freeze();
            handleWithdraw(withdrawProvider, msg.sender);
            withdrawProvider.finalize();
            return;
        }
     }

    function guaranteeLiquidity(uint tokenBalance) internal returns(bool success){

        if(getStatusStep(GETETH) == 0) {
            uint _totalETHToReturn = tokenBalance.mul(getPrice()).div(10**decimals);
            if (_totalETHToReturn <= getETHBalance()) {
                return true;
            }

            // tokenPercentToSell must be freeze as class variable.
            // 10**18 is the highest preccision for all possible tokens
            freezeBalance = _totalETHToReturn.sub(getETHBalance()).mul(TOKEN_DENOMINATOR).div(getAssetsValue());
        }
        return getETHFromTokens(freezeBalance);
    }

    // solhint-disable-next-line
    function withdraw() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {
        startGasCalculation();

        require(productStatus == Status.AVAILABLE || productStatus == Status.WITHDRAWING);
        productStatus = Status.WITHDRAWING;

        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));

        // Check if there is request
        address[] memory _requests = withdrawProvider.getUserRequests();
        uint _withdrawStatus = getStatusStep(WITHDRAW);



        if (_withdrawStatus == 0 && getStatusStep(GETETH) == 0) {
            checkLocker(WITHDRAW);
            if (_requests.length == 0) {
                productStatus = Status.AVAILABLE;
                reimburse();
                return true;
            }
        }

        if (_withdrawStatus == 0) {
            if(!guaranteeLiquidity(getWithdrawAmount())) {
                reimburse();
                return false;
            }
            withdrawProvider.freeze();
        }

        uint _transfers = initializeOrContinueStep(WITHDRAW);
        uint i;

        for (i = _transfers; i < _requests.length && goNextStep(WITHDRAW); i++) {
            if(!handleWithdraw(withdrawProvider, _requests[i])){ continue; }
        }

        if (i == _requests.length) {
            withdrawProvider.finalize();
            finalizeStep(WITHDRAW);
            productStatus = Status.AVAILABLE;
        }
        reimburse();
        return i == _requests.length; // True if completed
    }

    function handleWithdraw(WithdrawInterface _withdrawProvider, address _investor) private returns (bool) {
        uint _eth;
        uint _tokenAmount;

        (_eth, _tokenAmount) = _withdrawProvider.withdraw(_investor);
        if (_tokenAmount == 0) {return false;}

        balances[_investor] =  balances[_investor].sub(_tokenAmount);
        emit Transfer(_investor, 0x0, _tokenAmount); // ERC20 Required event

        totalSupply_ = totalSupply_.sub(_tokenAmount);
        address(_investor).transfer(_eth);

        return true;
    }

    function checkLocker(bytes32 category) internal {
        LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(category);
    }

    function startGasCalculation() internal {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
    }

    // solhint-disable-next-line
    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee = accumulatedFee.sub(reimbursedAmount);
        // emit Reimbursed(reimbursedAmount);
        msg.sender.transfer(reimbursedAmount);
    }

    // solhint-disable-next-line
    function tokensWithAmount() public view returns( ERC20Extended[] memory) {
        // First check the length
        uint length = 0;
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = ERC20Extended(tokens[i]).balanceOf(address(this));
            if (_amounts[i] > 0) {length++;}
        }

        ERC20Extended[] memory _tokensWithAmount = new ERC20Extended[](length);
        // Then create they array
        uint index = 0;
        for (uint j = 0; j < tokens.length; j++) {
            if (_amounts[j] > 0) {
                _tokensWithAmount[index] = ERC20Extended(tokens[j]);
                index++;
            }
        }
        return _tokensWithAmount;
    }

    // _tokenPercentage must come in TOKEN_DENOMIANTOR
    function getETHFromTokens(uint _tokenPercentage) internal returns(bool success) {
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        uint currentStep = initializeOrContinueStep(GETETH);
        uint i; // Current step to tokens.length
        uint arrayLength = getNextArrayLength(GETETH, currentStep);
        if(currentStep == 0) {
            freezeTokens = tokensWithAmount();
        }

        ERC20Extended[] memory _tokensThisStep = new ERC20Extended[](arrayLength);
        uint[] memory _amounts = new uint[](arrayLength);
        uint[] memory _sellRates = new uint[](arrayLength);

        for(i = currentStep;i < freezeTokens.length && goNextStep(GETETH); i++){
            uint sellIndex = i.sub(currentStep);
            _tokensThisStep[sellIndex] = freezeTokens[i];
            _amounts[sellIndex] = _tokenPercentage.mul(freezeTokens[i].balanceOf(address(this))).div(TOKEN_DENOMINATOR);
            (, _sellRates[sellIndex] ) = exchange.getPrice(freezeTokens[i], ETH, _amounts[sellIndex], 0x0);
            approveExchange(address(_tokensThisStep[sellIndex]), _amounts[sellIndex]);
        }
        require(exchange.sellTokens(_tokensThisStep, _amounts, _sellRates, address(this), 0x0));

        if(i == freezeTokens.length) {
            finalizeStep(GETETH);
            return true;
        }
        return false;
    }

    // ----------------------------- REBALANCE -----------------------------
    // solhint-disable-next-line
    function buyTokens() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {
        startGasCalculation();

        require(productStatus == Status.AVAILABLE || productStatus == Status.BUYING);
        productStatus = Status.BUYING;

        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        // Start?
        if (getStatusStep(BUYTOKENS) == 0) {
            checkLocker(BUYTOKENS);
            if (tokens.length == 0 || getETHBalance() == 0) {
                productStatus = Status.AVAILABLE;
                reimburse();
                return true;
            }
            freezeBalance = getETHBalance();
        }
        uint currentStep = initializeOrContinueStep(BUYTOKENS);

        // Check the length of the array
        uint arrayLength = getNextArrayLength(BUYTOKENS, currentStep);

        uint[] memory _amounts = new uint[](arrayLength);
        // Initialize to 0, making sure any rate is fine
        uint[] memory _rates = new uint[](arrayLength);
        // Initialize to 0, making sure any rate is fine
        ERC20Extended[] memory _tokensErc20 = new ERC20Extended[](arrayLength);
        uint _totalAmount = 0;
        uint i; // Current step to tokens.length
        uint _buyIndex; // 0 to currentStepLength
        for (i = currentStep; i < tokens.length && goNextStep(BUYTOKENS); i++) {
            _buyIndex = i - currentStep;
            _amounts[_buyIndex] = freezeBalance.mul(weights[i]).div(100);
            _tokensErc20[_buyIndex] = ERC20Extended(tokens[i]);
            (, _rates[_buyIndex] ) = exchange.getPrice(ETH, _tokensErc20[_buyIndex], _amounts[_buyIndex], 0x0);
            _totalAmount = _totalAmount.add(_amounts[_buyIndex]);
        }

        require(exchange.buyTokens.value(_totalAmount)(_tokensErc20, _amounts, _rates, address(this), 0x0));

        if(i == tokens.length) {
            finalizeStep(BUYTOKENS);
            freezeBalance = 0;
            productStatus = Status.AVAILABLE;
            reimburse();
            return true;
        }
        reimburse();
        return false;
    }

    // solhint-disable-next-line
    function rebalance() public onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns (bool success) {
        startGasCalculation();

        require(productStatus == Status.AVAILABLE || productStatus == Status.REBALANCING);

        RebalanceInterface rebalanceProvider = RebalanceInterface(getComponentByName(REBALANCE));
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        if (!rebalanceProvider.getRebalanceInProgress()) {
            checkLocker(REBALANCE);
        }

        address[] memory _tokensToSell;
        uint[] memory _amounts;
        address[] memory _tokensToBuy;
        uint i;

        (_tokensToSell, _amounts, _tokensToBuy,,) = rebalanceProvider.rebalanceGetTokensToSellAndBuy(rebalanceDeltaPercentage);
        if(_tokensToSell.length == 0) {
            reimburse(); // Completed case
            return true;
        }
        // solhint-disable-next-line
        uint ETHBalanceBefore = getETHBalance();

        uint currentStep = initializeOrContinueStep(REBALANCE);
        uint stepStatus = getStatusStep(REBALANCE);
        // solhint-disable-next-line

        productStatus = Status.REBALANCING;

        // Sell Tokens
        if ( stepStatus == uint(RebalancePhases.SellTokens)) {
            for (i = currentStep; i < _tokensToSell.length && goNextStep(REBALANCE) ; i++) {
                approveExchange(_tokensToSell[i], _amounts[i]);
                // solhint-disable-next-line

                require(exchangeProvider.sellToken(ERC20Extended(_tokensToSell[i]), _amounts[i], 0, address(this), 0x0));
            }

            rebalanceReceivedETHAmountFromSale = rebalanceReceivedETHAmountFromSale.add(getETHBalance()).sub(ETHBalanceBefore) ;
            if (i ==  _tokensToSell.length) {
                updateStatusStep(REBALANCE);
                currentStep = 0;
            }
        }
        // Buy Tokens
        if (stepStatus == uint(RebalancePhases.BuyTokens)) {
            _amounts = rebalanceProvider.recalculateTokensToBuyAfterSale(rebalanceReceivedETHAmountFromSale);
            for (i = currentStep; i < _tokensToBuy.length && goNextStep(REBALANCE); i++) {
                require(
                    // solhint-disable-next-line
                    exchangeProvider.buyToken.value(_amounts[i])(ERC20Extended(_tokensToBuy[i]), _amounts[i], 0, address(this), 0x0)
                );
            }

            if(i == _tokensToBuy.length) {
                finalizeStep(REBALANCE);
                rebalanceProvider.finalize();
                rebalanceReceivedETHAmountFromSale = 0;
                productStatus = Status.AVAILABLE;
                reimburse();   // Completed case
                return true;
            }
        }
        reimburse(); // Not complete case
        return false;
    }
    // ----------------------------- STEP PROVIDER -----------------------------
    function initializeOrContinueStep(bytes32 category) internal returns(uint) {
        return  StepInterface(getComponentByName(STEP)).initializeOrContinue(category);
    }

    function getStatusStep(bytes32 category) internal view returns(uint) {
        return  StepInterface(getComponentByName(STEP)).getStatus(category);
    }

    function finalizeStep(bytes32 category) internal returns(bool) {
        return  StepInterface(getComponentByName(STEP)).finalize(category);
    }

    function goNextStep(bytes32 category) internal returns(bool) {
        return StepInterface(getComponentByName(STEP)).goNextStep(category);
    }

    function updateStatusStep(bytes32 category) internal returns(uint) {
        return StepInterface(getComponentByName(STEP)).updateStatus(category);
    }

    function getWithdrawAmount() internal view returns(uint) {
        return WithdrawInterface(getComponentByName(WITHDRAW)).getTotalWithdrawAmount();
    }

    function getNextArrayLength(bytes32 stepCategory, uint currentStep) internal view returns(uint) {
        uint arrayLength = StepInterface(getComponentByName(STEP)).getMaxCalls(stepCategory);
        if(arrayLength.add(currentStep) >= tokens.length ) {
            arrayLength = tokens.length.sub(currentStep);
        }
        return arrayLength;
    }

    function approveExchange(address _token, uint amount) internal {
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        ERC20NoReturn(_token).approve(exchange, 0);
        ERC20NoReturn(_token).approve(exchange, amount);
    }

    // ----------------------------- WHITELIST -----------------------------
    // solhint-disable-next-line
    function enableWhitelist(WhitelistKeys _key, bool enable) public onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setStatus(uint(_key), enable);
        return true;
    }

    // solhint-disable-next-line
    function setAllowed(address[] accounts, WhitelistKeys _key, bool allowed) public onlyOwner returns(bool) {
        WhitelistInterface(getComponentByName(WHITELIST)).setAllowed(accounts, uint(_key), allowed);
        return true;
    }
}
