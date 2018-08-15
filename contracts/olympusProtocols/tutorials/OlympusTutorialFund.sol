pragma solidity 0.4.24;

import "../../BaseDerivative.sol";
import "../../interfaces/FundInterface.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";
import "../../interfaces/WithdrawInterface.sol";
import "../../interfaces/MarketplaceInterface.sol";
import "../../interfaces/LockerInterface.sol";
import "../../libs/ERC20NoReturn.sol";


contract OlympusTutorialFund is FundInterface, BaseDerivative {
    using SafeMath for uint256;

    uint public constant INITIAL_VALUE = 10**18; // 1 ETH

    event TokenUpdated(address _token, uint amount);
    event FundStatusChanged(DerivativeStatus status);

    // Current balance of each investor
    mapping(address => uint) public investors;
    // Relation between tokens and amounts storage in this contract.
    // This information could be taken directly from ERC20, here we mantain a local copy.
    mapping(address => uint) public amounts;
    // The tokens that are holding balance now.
    // If the amount is 0 and activeTokens is false the token was never bought, not belong to the fund.
    // If the amount is 0 and activeToken is true, the token has been bought but sold afterwards.
    mapping(address => bool) public activeTokens;

    /// ------ Tutorial 6.1 variables
    uint public MAX_INVESTORS;
    uint public currentNumberOfInvestors;

    uint public constant TRADE_INTERVAL = 0 seconds;
    bytes32 public constant LOCKER = "LockerProvider";

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
    function initialize(address _componentList, uint _maxInvestors) external onlyOwner {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
        require(_maxInvestors > 0);

        super._initialize(_componentList);
        bytes32[4] memory names = [MARKET, EXCHANGE, WITHDRAW, LOCKER];
        excludedComponents.push(LOCKER);

        for (uint i = 0; i < names.length; i++) {
            // updated component and approve MOT for charging fees
            updateComponent(names[i]);
        }


        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();

        status = DerivativeStatus.Active;
        emit FundStatusChanged(status);

        MAX_INVESTORS = _maxInvestors;
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
         public onlyOwner returns(bool) {

        // Get the component
        LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

         // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _amounts.length; i++) {
            lockerProvider.checkLockerByTime(bytes32(address(_tokens[i])));
            totalEthRequired = totalEthRequired.add(_amounts[i]);
        }
        require(address(this).balance >= totalEthRequired);

        require(
            OlympusExchangeInterface(getComponentByName(EXCHANGE))
            .buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId)
        );
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
      public onlyOwner returns (bool) {

        LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint i = 0; i < tokens.length; i++) {
            lockerProvider.checkLockerByTime(bytes32(address(_tokens[i])));
            ERC20NoReturn(_tokens[i]).approve(exchange, 0);
            ERC20NoReturn(_tokens[i]).approve(exchange, _amounts[i]);
        }

        require(exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId));
        updateTokens(_tokens);
        return true;
    }
     // ----------------------------- DERIVATIVE -----------------------------

    function invest() public payable returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
        require(balances[msg.sender] > 0 || currentNumberOfInvestors < MAX_INVESTORS, "Only limited number can invest");

         // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if (totalSupply_ > 0) {
            _sharePrice = getPrice().sub((msg.value.mul(10**decimals)).div(totalSupply_));
         } else {
            _sharePrice = INITIAL_VALUE;
        }

        uint _investorShare = msg.value.mul(10**decimals).div(_sharePrice);

        if( balances[msg.sender] == 0) {
            currentNumberOfInvestors++;
        }

        balances[msg.sender] = balances[msg.sender].add(_investorShare);
        totalSupply_ = totalSupply_.add(_investorShare);
        return true;
    }

    function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool) {
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New);
        require(status != DerivativeStatus.Closed && _status != DerivativeStatus.Closed);
        status = _status;
        emit FundStatusChanged(status);
        return true;
    }

    function close() public onlyOwner returns(bool success) {
        require(status != DerivativeStatus.New);
        getETHFromTokens(DENOMINATOR); // 100% all the tokens
        status = DerivativeStatus.Closed;
        emit FundStatusChanged(status);
        return true;
    }

    function getPrice() public view returns(uint) {
        if (totalSupply_ == 0) {
            return INITIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          (getAssetsValue().add(address(this).balance).mul(10**decimals)).div(totalSupply_),
        );
    }


    function getAssetsValue() public view returns (uint) {
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
            _totalTokensValue = _totalTokensValue.add(_balance.mul(10**18).div(_expectedRate));

        }
        return _totalTokensValue;
    }


    function guaranteeLiquidity(uint tokenBalance) internal {
        uint _totalETHToReturn = tokenBalance.mul(getPrice()).div(10**decimals);
        if (_totalETHToReturn > address(this).balance) {
            uint _tokenPercentToSell = ((_totalETHToReturn.sub(address(this).balance)).mul(DENOMINATOR)).div(getAssetsValue());
            getETHFromTokens(_tokenPercentToSell);
        }
    }

   // ----------------------------- WITHDRAW -----------------------------
   // solhint-disable-next-line
    function withdraw() external returns(bool)
    {
        require(balances[msg.sender] > 0, "Insufficient balance");
        WithdrawInterface withdrawProvider = WithdrawInterface(getComponentByName(WITHDRAW));
        withdrawProvider.request(msg.sender, balances[msg.sender]); // _amount is not used in simple withdraw.

        guaranteeLiquidity(withdrawProvider.getTotalWithdrawAmount());
        withdrawProvider.freeze();

        uint ethAmount;
        uint tokenAmount;
        (ethAmount, tokenAmount) = withdrawProvider.withdraw(msg.sender);

        balances[msg.sender] = balances[msg.sender].sub(tokenAmount);
        totalSupply_ = totalSupply_.sub(tokenAmount);
        msg.sender.transfer(ethAmount);
        withdrawProvider.finalize();

        // We withdraw all the amount, so the investor counter gets reduced.
        currentNumberOfInvestors--;

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
    function getETHFromTokens(uint _tokenPercentage) internal {
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        uint[] memory _amounts = new uint[](_tokensToSell.length);
        uint[] memory _sellRates = new uint[](_tokensToSell.length);
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint i = 0; i < _tokensToSell.length; i++) {
            _amounts[i] = _tokenPercentage.mul(_tokensToSell[i].balanceOf(address(this))).div(DENOMINATOR);
            (, _sellRates[i] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], 0x0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, 0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, _amounts[i]);
        }

        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), 0x0));
        updateTokens(_tokensToSell);
    }

    function updateTokens(ERC20Extended[] _updatedTokens) private returns(bool success) {
        ERC20 _tokenAddress;
        // Get the provider from the list
        LockerInterface lockerProvider = LockerInterface(getComponentByName(LOCKER));

        for (uint i = 0; i < _updatedTokens.length; i++) {
            _tokenAddress = _updatedTokens[i];
            amounts[_tokenAddress] = _tokenAddress.balanceOf(this);
            if (amounts[_tokenAddress] > 0 && !activeTokens[_tokenAddress]) {
                tokens.push(_tokenAddress);
                activeTokens[_tokenAddress] = true;
                // Initialize the provider
                lockerProvider.setTimeInterval(bytes32(address(_tokenAddress)), TRADE_INTERVAL);
                continue;
            }
            emit TokenUpdated(_tokenAddress, amounts[_tokenAddress]);
        }
        return true;
    }
}
