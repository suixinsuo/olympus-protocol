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
import "../interfaces/RiskControlInterface.sol";
import "../interfaces/LockerInterface.sol";
import "../interfaces/StepInterface.sol";


contract OlympusIndex is IndexInterface, Derivative {
    using SafeMath for uint256;

    bytes32 public constant BUYTOKENS = "BuyTokens";

    event ChangeStatus(DerivativeStatus status);

    uint public constant DENOMINATOR = 10000;
    uint public constant INITIAL_VALUE =  10**18;
    uint[] public weights;
    uint public accumulatedFee = 0;
    uint public rebalanceDeltaPercentage = 0; // by default, can be 30, means 0.3%.
    uint public rebalanceReceivedETHAmountFromSale;
    uint public freezeETHBalance; // For operations
    enum RebalancePhases { Initial, SellTokens, BuyTokens }

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
    // solhint-disable-next-line
    function initialize(
        address _componentList,
        uint _initialFundFee,
        uint _rebalanceDeltaPercentage
   )
   external onlyOwner payable {
        require(status == DerivativeStatus.New);
        require(msg.value > 0); // Require some balance for internal opeations as reimbursable
        require(_componentList != 0x0);
        require(_rebalanceDeltaPercentage <= DENOMINATOR);

        rebalanceDeltaPercentage = _rebalanceDeltaPercentage;
        super._initialize(_componentList);
        bytes32[10] memory names = [
            MARKET, EXCHANGE, REBALANCE, RISK, WHITELIST, FEE, REIMBURSABLE, WITHDRAW, LOCKER, STEP
        ];
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

        uint[] memory _maxSteps = new uint[](3);
        bytes32[] memory _categories = new bytes32[](3);
        _maxSteps[0] = 3;
        _maxSteps[1] = 10;
        _maxSteps[2] = 5;
        _categories[0] = REBALANCE;
        _categories[1] = WITHDRAW;
        _categories[2] = BUYTOKENS;

        StepInterface(getComponentByName(STEP)).setMultipleMaxCalls(_categories, _maxSteps);
        status = DerivativeStatus.Active;

        emit ChangeStatus(status);

        accumulatedFee += msg.value;
    }


    // Return tokens and weights
    // solhint-disable-next-line
    function getTokens() public view returns (address[] _tokens, uint[] _weights) {
        return (tokens, weights);
    }

    // Return tokens and amounts
    // solhint-disable-next-line
    function getTokensAndAmounts() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = ERC20Extended(tokens[i]).balanceOf(address(this));
        }
        return (tokens, _amounts);
    }

    // solhint-disable-next-line
    function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool) {
        // solhint-disable-next-line
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New && _status != DerivativeStatus.Closed);
        require(status != DerivativeStatus.Closed && _status != DerivativeStatus.Closed);

        status = _status;
        emit ChangeStatus(status);
        return true;
    }

    // solhint-disable-next-line
    function close() public onlyOwner returns(bool success) {
        require(status != DerivativeStatus.New);
        getETHFromTokens(DENOMINATOR); // 100% all the tokens
        status = DerivativeStatus.Closed;
        emit ChangeStatus(status);
        return true;
    }

    // ----------------------------- DERIVATIVE -----------------------------
    // solhint-disable-next-line
    function invest() public payable
     whenNotPaused
     whitelisted(WhitelistKeys.Investment)
     withoutRisk(msg.sender, address(this), ETH, msg.value, 1)
     returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
         // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if (totalSupply_ > 0) {
            _sharePrice = getPrice() - ((msg.value * 10 ** decimals) / totalSupply_);
         } else {
            _sharePrice = INITIAL_VALUE;
        }

        ChargeableInterface feeManager = ChargeableInterface(getComponentByName(FEE));
        uint fee = feeManager.calculateFee(msg.sender, msg.value);

        uint _investorShare = ((msg.value-fee) * 10 ** decimals) / _sharePrice;

        accumulatedFee += fee;
        balances[msg.sender] += _investorShare;
        totalSupply_ += _investorShare;

        // emit Invested(msg.sender, _investorShare);
        return true;
    }

    function getPrice() public view returns(uint) {
        if (totalSupply_ == 0) {
            return INITIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          ((getAssetsValue() + getETHBalance()) * 10 ** decimals) / (totalSupply_),
        );
    }

    function getETHBalance() public view returns(uint) {
        return address(this).balance - accumulatedFee;
    }

    function getAssetsValue() public view returns (uint) {
        // TODO cast to OlympusExchangeInterface
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        uint _balance;

        for (uint i = 0; i < tokens.length; i++) {

            _balance = ERC20(tokens[i]).balanceOf(address(this));

            if (_balance == 0) {continue;}
            (_expectedRate, ) = exchangeProvider.getPrice(ETH, ERC20Extended(tokens[i]), 10**18, 0x0);
            if (_expectedRate == 0) {continue;}
            _totalTokensValue += (_balance * 10**18) / _expectedRate;

        }
        return _totalTokensValue;
    }

    // ----------------------------- FEES  -----------------------------
    // Owner can send ETH to the Index, to perform some task, this eth belongs to him
    // solhint-disable-next-line
    function addOwnerBalance() external payable onlyOwner {
        accumulatedFee += msg.value;
    }

    // solhint-disable-next-line
    function withdrawFee(uint amount) external onlyOwner whenNotPaused returns(bool) {
        require(accumulatedFee >= amount);
        accumulatedFee -= amount;
        msg.sender.transfer(amount);
        return true;
    }

    // solhint-disable-next-line
    function setManagementFee(uint _fee) external onlyOwner {
        ChargeableInterface(getComponentByName(FEE)).setFeePercentage(_fee);
    }

    // solhint-disable-next-line
    function getManagementFee() external view returns(uint) {
        return ChargeableInterface(getComponentByName(FEE)).getFeePercentage();
    }

    // ----------------------------- WITHDRAW -----------------------------
    // solhint-disable-next-line
    function requestWithdraw(uint amount) external
      whenNotPaused
      withoutRisk(msg.sender, address(this), address(this), amount, getPrice())
    {
        WithdrawInterface(getComponentByName(WITHDRAW)).request(msg.sender, amount);
    }

    function guaranteeLiquidity(uint tokenBalance) internal {
        uint _totalETHToReturn = (tokenBalance * getPrice()) / 10 ** decimals;
        if (_totalETHToReturn > getETHBalance()) {
            uint _tokenPercentToSell = ((_totalETHToReturn - getETHBalance()) * DENOMINATOR) / getAssetsValue();
            getETHFromTokens(_tokenPercentToSell);
        }
    }

    // solhint-disable-next-line
    function withdraw() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        StepInterface stepProvider = StepInterface(getComponentByName(STEP));

        // Check if there is request
        address[] memory _requests = withdrawProvider.getUserRequests();

        uint _transfers = stepProvider.initializeOrContinue(WITHDRAW);
        uint _eth;
        uint _tokenAmount;
        uint i;
        if (_transfers == 0) {
            LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(WITHDRAW);
            if (_requests.length == 0) {
                reimburse();
                return true;
            }
            guaranteeLiquidity(withdrawProvider.getTotalWithdrawAmount());
            withdrawProvider.freeze();
        }

        for (i = _transfers; i < _requests.length && stepProvider.goNextStep(WITHDRAW); i++) {
            (_eth, _tokenAmount) = withdrawProvider.withdraw(_requests[i]);
            if (_tokenAmount == 0) {continue;}

            balances[_requests[i]] -= _tokenAmount;
            totalSupply_ -= _tokenAmount;
            address(_requests[i]).transfer(_eth);
            _transfers++;
        }

        if (i == _requests.length) {
            withdrawProvider.finalize();
            stepProvider.finalize(WITHDRAW);
        }
        reimburse();
        return i == _requests.length; // True if completed
    }

    // solhint-disable-next-line
    function reimburse() private {
        uint reimbursedAmount = ReimbursableInterface(getComponentByName(REIMBURSABLE)).reimburse();
        accumulatedFee -= reimbursedAmount;
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

    function getETHFromTokens(uint _tokenPercentage ) private {
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        uint[] memory _amounts = new uint[](_tokensToSell.length);
        uint[] memory _sellRates = new uint[](_tokensToSell.length);
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint i = 0; i < _tokensToSell.length; i++) {
            _amounts[i] = (_tokenPercentage * _tokensToSell[i].balanceOf(address(this))) / DENOMINATOR;
            (, _sellRates[i] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], 0x0);
            require(!hasRisk(address(this), exchange, address(_tokensToSell[i]), _amounts[i], 0));
            _tokensToSell[i].approve(exchange, 0);
            _tokensToSell[i].approve(exchange, _amounts[i]);
        }
        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), 0x0, 0x0));
    }

    // ----------------------------- REBALANCE -----------------------------
    // solhint-disable-next-line
    function buyTokens() external onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns(bool) {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        StepInterface stepProvider = StepInterface(getComponentByName(STEP));

        uint currentStep = stepProvider.initializeOrContinue(BUYTOKENS);
        // Start?
        if (currentStep == 0) {
            LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(BUYTOKENS);
            if (tokens.length == 0 || getETHBalance() == 0) {
                reimburse();
                return true;
            }
            freezeETHBalance = getETHBalance();
        }
        // Check the length of the array
        uint arrayLength = stepProvider.getMaxCalls(BUYTOKENS);
        if(arrayLength + currentStep >= tokens.length ) {
            arrayLength = tokens.length - currentStep;
        }

        uint[] memory _amounts = new uint[](arrayLength);
        // Initialize to 0, making sure any rate is fine
        uint[] memory _rates = new uint[](arrayLength);
        // Initialize to 0, making sure any rate is fine
        ERC20Extended[] memory _tokensErc20 = new ERC20Extended[](arrayLength);
        uint totalAmount = 0;
        uint i; // Current step to tokens.length
        uint buyIndex; // 0 to currentStepLength
        for (i = currentStep; i < tokens.length && stepProvider.goNextStep(BUYTOKENS); i++) {
            buyIndex = i - currentStep;
            _amounts[buyIndex] = freezeETHBalance * weights[i] / 100;
            _tokensErc20[buyIndex] = ERC20Extended(tokens[i]);
            (, _rates[buyIndex] ) = exchange.getPrice(ETH, _tokensErc20[buyIndex], _amounts[buyIndex], 0x0);
            totalAmount += _amounts[buyIndex];
        }

        require(exchange.buyTokens.value(totalAmount)(_tokensErc20, _amounts, _rates, address(this), 0x0, 0x0));

        if(i == tokens.length) {
            stepProvider.finalize(BUYTOKENS);
            freezeETHBalance = 0;
        }

        reimburse();
        return true;
    }

    // solhint-disable-next-line
    function rebalance() public onlyOwnerOrWhitelisted(WhitelistKeys.Maintenance) whenNotPaused returns (bool success) {
        ReimbursableInterface(getComponentByName(REIMBURSABLE)).startGasCalculation();
        StepInterface stepProvider = StepInterface(ReimbursableInterface(getComponentByName(STEP)));
        RebalanceInterface rebalanceProvider = RebalanceInterface(getComponentByName(REBALANCE));
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        if (!rebalanceProvider.getRebalanceInProgress()) {
            LockerInterface(getComponentByName(LOCKER)).checkLockerByTime(REBALANCE);
        }

        address[] memory tokensToSell;
        uint[] memory amountsToSell;
        address[] memory tokensToBuy;
        uint[] memory amountsToBuy;
        uint i;
        // solhint-disable-next-line
        uint ETHBalanceBefore = getETHBalance();

        uint currentStep = stepProvider.initializeOrContinue(REBALANCE);

        // solhint-disable-next-line
        (tokensToSell, amountsToSell, tokensToBuy, amountsToBuy,) = rebalanceProvider.rebalanceGetTokensToSellAndBuy(rebalanceDeltaPercentage);
        // Sell Tokens
        if (stepProvider.getStatus(REBALANCE) == uint(RebalancePhases.SellTokens)) {
            for (i = currentStep; i < tokensToSell.length; i++) {
                if (stepProvider.goNextStep(REBALANCE) == false) {
                    rebalanceReceivedETHAmountFromSale += getETHBalance() - ETHBalanceBefore;
                    reimburse();
                    return false;
                }
                ERC20NoReturn(tokensToSell[i]).approve(address(exchangeProvider), 0);
                ERC20NoReturn(tokensToSell[i]).approve(address(exchangeProvider), amountsToSell[i]);
                // solhint-disable-next-line
                require(exchangeProvider.sellToken(ERC20Extended(tokensToSell[i]), amountsToSell[i], 0, address(this), 0x0, 0x0));
            }
            rebalanceReceivedETHAmountFromSale += getETHBalance() - ETHBalanceBefore;
            stepProvider.updateStatus(REBALANCE);
            currentStep = 0;
        }


        // Buy Tokens
        amountsToBuy = rebalanceProvider.recalculateTokensToBuyAfterSale(rebalanceReceivedETHAmountFromSale);
        if (stepProvider.getStatus(REBALANCE) == uint(RebalancePhases.BuyTokens)) {
            for (i = currentStep; i < tokensToBuy.length; i++) {
                if (stepProvider.goNextStep(REBALANCE) == false) {
                    reimburse();
                    return false;
                }
                require(
                    // solhint-disable-next-line
                    exchangeProvider.buyToken.value(amountsToBuy[i])(ERC20Extended(tokensToBuy[i]), amountsToBuy[i], 0, address(this), 0x0, 0x0)
                );
            }
        }

        stepProvider.finalize(REBALANCE);
        rebalanceProvider.finalize();
        rebalanceReceivedETHAmountFromSale = 0;
        reimburse();
        return true;
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

    // ----------------------------- INITIALIZATION HELPERS -----------------------------
    // solhint-disable-next-line
    function approveComponents() private {
        approveComponent(EXCHANGE);
        approveComponent(WITHDRAW);
        approveComponent(RISK);
        approveComponent(WHITELIST);
        approveComponent(FEE);
        approveComponent(REIMBURSABLE);
        approveComponent(REBALANCE);
    }

}
