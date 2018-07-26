pragma solidity 0.4.24;

import "../BaseDerivative.sol";
import "../interfaces/FundInterface.sol";
import "../interfaces/implementations/OlympusExchangeInterface.sol";
import "../interfaces/WithdrawInterface.sol";
import "../interfaces/MarketplaceInterface.sol";
import "../interfaces/ChargeableInterface.sol";
import "../libs/ERC20NoReturn.sol";


contract OlympusBasicFund is FundInterface, BaseDerivative {
    using SafeMath for uint256;

    uint public constant INITIAL_VALUE =  10**18; // 1 ETH

    event TokenUpdated(address _token, uint amount);
    event FundStatusChanged(DerivativeStatus status);

    mapping(address => uint) public investors;
    mapping(address => uint) public amounts;
    mapping(address => bool) public activeTokens;

 
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
    function initialize(address _componentList) external onlyOwner {
        require(_componentList != 0x0);
        require(status == DerivativeStatus.New);
 
        super._initialize(_componentList);
        bytes32[3] memory names = [MARKET, EXCHANGE, WITHDRAW];
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

        status = DerivativeStatus.Active;
        emit FundStatusChanged(status);

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

         // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _amounts.length; i++) {
          totalEthRequired += _amounts[i];
        }
        require(address(this).balance >= totalEthRequired);

        require(OlympusExchangeInterface(getComponentByName(EXCHANGE))
          .buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId, 0x0)
        );
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates)
      public onlyOwner returns (bool) {

        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));

        for (uint i = 0; i < tokens.length; i++) {
            ERC20NoReturn(_tokens[i]).approve(exchange, 0);
            ERC20NoReturn(_tokens[i]).approve(exchange, _amounts[i]);
        }

        require(exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId, 0x0));
        updateTokens(_tokens);
        return true;
    }
     // ----------------------------- DERIVATIVE -----------------------------

    function invest() public
        payable

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

        uint _investorShare = msg.value * 10 ** decimals / _sharePrice;

        balances[msg.sender] += _investorShare;
        totalSupply_ += _investorShare;

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
          ((getAssetsValue() + address(this).balance) * 10 ** decimals) / (totalSupply_),
        );
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
            if (_balance == 0) { continue; }

            (_expectedRate, ) = exchangeProvider.getPrice(ETH, ERC20Extended(tokens[i]), _balance, 0x0);

            if (_expectedRate == 0) { continue; }
            _totalTokensValue += (_balance * 10**18) / _expectedRate;

        }
        return _totalTokensValue;
    }

    
    function guaranteeLiquidity(uint tokenBalance) internal {
        uint _totalETHToReturn = (tokenBalance * getPrice()) / 10 ** decimals;
        if (_totalETHToReturn > address(this).balance) {
            uint _tokenPercentToSell = ((_totalETHToReturn - address(this).balance) * DENOMINATOR) / getAssetsValue();
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

        balances[msg.sender] -= tokenAmount;
        totalSupply_ -= tokenAmount;
        msg.sender.transfer(ethAmount);
        withdrawProvider.finalize();

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
            _amounts[i] = (_tokenPercentage * _tokensToSell[i].balanceOf(address(this))) / DENOMINATOR;
            (, _sellRates[i] ) = exchange.getPrice(_tokensToSell[i], ETH, _amounts[i], 0x0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, 0);
            ERC20NoReturn(_tokensToSell[i]).approve(exchange, _amounts[i]);
        }

        require(exchange.sellTokens(_tokensToSell, _amounts, _sellRates, address(this), 0x0, 0x0));
        updateTokens(_tokensToSell);
    }

    function approveComponents() private {
        approveComponent(EXCHANGE);
        approveComponent(WITHDRAW);
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
            emit TokenUpdated(_tokenAddress, amounts[_tokenAddress]);
        }
        return true;
    }
}