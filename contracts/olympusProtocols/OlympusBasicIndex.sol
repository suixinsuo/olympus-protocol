pragma solidity 0.4.24;

import "../BaseDerivative.sol";
import "../interfaces/IndexInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/RebalanceInterface.sol";
import "../libs/ERC20NoReturn.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

import "../libs/ERC20Extended.sol";

contract OlympusBasicIndex is IndexInterface, BaseDerivative, StandardToken, ERC20Extended {
    using SafeMath for uint256;

    uint public constant INITIAL_VALUE = 10**18; // 1 ETH
    uint public constant TOKEN_DENOMINATOR = 10**18; // Apply % to a denominator, 18 is the minimum highetst precision required

    event TokenUpdated(address _token, uint amount);
    event StatusChanged(DerivativeStatus status);

    mapping(address => uint) public investors;
    mapping(address => bool) public activeTokens;

    uint public rebalanceDeltaPercentage = 0; // by default, can be 30, means 0.3%.

    modifier checkLength(address[] _tokens, uint[] _weights) {
        require(_tokens.length == _weights.length);
        _;
    }

    modifier checkWeights(uint[] _weights) {
        uint totalWeight;
        for (uint i = 0; i < _weights.length; i++) {
            totalWeight = totalWeight.add(_weights[i]);
        }
        require(totalWeight == 100);
        _;
    }

    constructor (
      string _name,
      string _symbol,
      string _description,
      bytes32 _category,
      uint _decimals,
      address[] _tokens,
      uint[] _weights)
      public checkLength(_tokens, _weights) checkWeights(_weights) {

        require(0<=_decimals&&_decimals<=18);

        // Check all tokens are ERC20Extended
        for (uint i = 0 ; i < tokens.length; i++) {
            ERC20Extended(_tokens[i]).balanceOf(address(this));
            require( ERC20Extended(_tokens[i]).decimals() <= 18);

        }

        name = _name;
        symbol = _symbol;
        totalSupply_ = 0;
        decimals = _decimals;
        description = _description;
        category = _category;

        version = "1.1-20181002";
        fundType = DerivativeType.Index;
        tokens = _tokens;
        weights = _weights;
        status = DerivativeStatus.New;
    }
    // ----------------------------- CONFIG -----------------------------
    // One time call
    function initialize(address _componentList, uint _rebalanceDeltaPercentage) external onlyOwner {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
        require(_rebalanceDeltaPercentage <= (10 ** decimals));

        super._initialize(_componentList);
        bytes32[4] memory names = [MARKET, EXCHANGE, WITHDRAW, REBALANCE];
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
        rebalanceDeltaPercentage = _rebalanceDeltaPercentage;
        status = DerivativeStatus.Active;
        emit StatusChanged(status);

    }

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

     // ----------------------------- DERIVATIVE -----------------------------

    function invest() public payable returns(bool) {
        require(status == DerivativeStatus.Active, "The Fund is not active");
        require(msg.value >= 10**15, "Minimum value to invest is 0.001 ETH");
         // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if (totalSupply_ > 0) {
            _sharePrice = getPrice().sub((msg.value.mul(10 ** decimals)).div(totalSupply_));
         } else {
            _sharePrice = INITIAL_VALUE;
        }

        uint _investorShare = msg.value.mul(10 ** decimals).div(_sharePrice);

        balances[msg.sender] = balances[msg.sender].add(_investorShare);
        totalSupply_ = totalSupply_.add(_investorShare);
        emit Transfer(0x0, msg.sender, _investorShare); // ERC20 Required event

        return true;
    }

    function changeStatus(DerivativeStatus _status) public onlyOwner returns(bool) {
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New);
        require(status != DerivativeStatus.Closed && _status != DerivativeStatus.Closed);
        status = _status;
        emit StatusChanged(status);
        return true;
    }

    function close() public onlyOwner returns(bool success) {
        require(status != DerivativeStatus.New);
        getETHFromTokens(TOKEN_DENOMINATOR); // 100% all the tokens
        status = DerivativeStatus.Closed;
        emit StatusChanged(status);
        return true;
    }

    function getPrice() public view returns(uint) {
        if (totalSupply_ == 0) {
            return INITIAL_VALUE;
        }
        uint valueETH = getAssetsValue().add(address(this).balance).mul(10 ** decimals);
        // Total Value in ETH among its tokens + ETH new added value
        return valueETH.div(totalSupply_);
    }


    function getAssetsValue() public view returns (uint) {
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

    function guaranteeLiquidity(uint tokenBalance) internal {
        uint _totalETHToReturn = tokenBalance.mul(getPrice()).div( 10 ** decimals);

        if (_totalETHToReturn > address(this).balance) {
            uint _ethDifference = _totalETHToReturn.sub(address(this).balance).mul(TOKEN_DENOMINATOR);
            uint _tokenPercentToSell = _ethDifference.div( getAssetsValue());
            getETHFromTokens(_tokenPercentToSell);
        }
    }

   // ----------------------------- WITHDRAW -----------------------------
   // solhint-disable-next-line
    function withdraw()
            external
            returns(bool)
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
        emit Transfer(msg.sender, 0x0, tokenAmount); // ERC20 Required event

        return true;
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
    function getETHFromTokens(uint _tokenPercentage) internal {
        ERC20Extended[] memory _tokensToSell = tokensWithAmount();
        uint[] memory _amounts = new uint[](_tokensToSell.length);
        uint[] memory _sellRates = new uint[](_tokensToSell.length);
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        for (uint i = 0; i < _tokensToSell.length; i++) {
            _amounts[i] = _tokenPercentage.mul(_tokensToSell[i].balanceOf(address(this))).div(TOKEN_DENOMINATOR);
            (, _sellRates[i] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], 0x0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, 0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, _amounts[i]);
        }

        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), 0x0));
    }

    // ----------------------------- BUY TOKENS -----------------------------
    function buyTokens() external onlyOwner  returns(bool) {

        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        if(address(this).balance == 0) {return true;}

        uint[] memory _amounts = new uint[](tokens.length);
        uint[] memory _rates = new uint[](tokens.length); // Initialize to 0, making sure any rate is fine
        ERC20Extended[] memory _tokensErc20 = new ERC20Extended[](tokens.length); // Initialize to 0, making sure any rate is fine
        uint ethBalance = address(this).balance;
        uint totalAmount = 0;

        for(uint8 i = 0; i < tokens.length; i++) {
            _amounts[i] = ethBalance.mul(weights[i]).div(100);
            _tokensErc20[i] = ERC20Extended(tokens[i]);
            (, _rates[i] ) = exchange.getPrice(ETH,  _tokensErc20[i],  _amounts[i], 0x0);
            totalAmount = totalAmount.add(_amounts[i]);
        }

        require(exchange.buyTokens.value(totalAmount)(_tokensErc20, _amounts, _rates, address(this), 0x0));
        return true;
    }
    // ----------------------------- REBALANCE -----------------------------


    function rebalance() public onlyOwner returns (bool success) {
        RebalanceInterface rebalanceProvider = RebalanceInterface(getComponentByName(REBALANCE));
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        address[] memory tokensToSell;
        uint[] memory amountsToSell;
        address[] memory tokensToBuy;
        uint[] memory amountsToBuy;
        uint8 i;
        uint ETHBalanceBefore = address(this).balance;

        (tokensToSell, amountsToSell, tokensToBuy, amountsToBuy,) = rebalanceProvider.rebalanceGetTokensToSellAndBuy(rebalanceDeltaPercentage);
        if(tokensToSell.length == 0) {
            return true;
        }
        // Sell Tokens
        for (i = 0; i < tokensToSell.length; i++) {
            ERC20NoReturn(tokensToSell[i]).approve(address(exchangeProvider), 0);
            ERC20NoReturn(tokensToSell[i]).approve(address(exchangeProvider), amountsToSell[i]);
            require(exchangeProvider.sellToken(ERC20Extended(tokensToSell[i]), amountsToSell[i], 0, address(this), 0x0));
        }

        // Buy Tokens
        amountsToBuy = rebalanceProvider.recalculateTokensToBuyAfterSale(address(this).balance - ETHBalanceBefore);
        for (i = 0; i < tokensToBuy.length; i++) {

            require(
                exchangeProvider.buyToken.value(amountsToBuy[i])(ERC20Extended(tokensToBuy[i]), amountsToBuy[i], 0, address(this), 0x0)
            );
        }
        rebalanceProvider.finalize();
        return true;
    }


    function approveComponents() private {
        approveComponent(EXCHANGE);
        approveComponent(WITHDRAW);
        approveComponent(REBALANCE);
    }

    function getETHBalance() public view returns(uint) {
        return address(this).balance;
    }

}
