pragma solidity 0.4.24;

import "../../Derivative.sol";
import "../../interfaces/FundInterface.sol";
import "../../libs/ERC20Extended.sol";
import "../../interfaces/implementations/OlympusExchangeInterface.sol";

contract MockFund is FundInterface, Derivative {

    string public name = "Dummy";
    uint256 public decimals = 18;
    string public symbol = "DMY";
    string public category = "Test";

    mapping(address => uint) investors;
    mapping(address => uint) amounts;
    mapping(address => bool) activeTokens;

    event Invested(address user, uint amount);


    bytes32 public constant EXCHANGE = "Exchange";
    uint public constant INITIAL_VALUE =  10**18;
    uint public constant DENOMINATOR = 10000;

    constructor(
      string _name,
      string _symbol,
      string _description,
      address exchangeAddress) public {
        name = _name;
        symbol = _symbol;
        description = _description;
        fundType = DerivativeType.Fund;

        status = DerivativeStatus.Active;
        setComponent(EXCHANGE, exchangeAddress);
    }

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
        }
        return true;
    }


    function buyTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[] _minimumRates)
         public onlyOwner returns(bool) {

        // Check we have the ethAmount required
        uint totalEthRequired = 0;
        for (uint i = 0; i < _amounts.length; i++) {totalEthRequired += _amounts[i];}
        require(address(this).balance >= totalEthRequired);


        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        exchange.buyTokens.value(totalEthRequired)(_tokens, _amounts, _minimumRates, address(this), _exchangeId, 0x0);
        updateTokens(_tokens);
        return true;

    }

    function sellTokens(bytes32 _exchangeId, ERC20Extended[] _tokens, uint[] _amounts, uint[]  _rates) public onlyOwner returns (bool) {
        OlympusExchangeInterface exchange = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        for(uint i = 0; i < tokens.length; i++) {
            _tokens[i].approve(address(exchange), 0);
            _tokens[i].approve(address(exchange), _amounts[i]);
        }
        exchange.sellTokens(_tokens, _amounts, _rates, address(this), _exchangeId, 0x0);
        updateTokens(_tokens);
        return true;
    }

    function changeStatus(DerivativeStatus _status) public returns(bool) {
        require(_status != DerivativeStatus.New && status != DerivativeStatus.New);
        status = _status;
        return true;
    }

    function close() public OnlyOwnerOrPausedTimeout returns(bool success) {
        require(status != DerivativeStatus.New);

        status = DerivativeStatus.Closed;

        return true;
    }

    function invest() public payable returns(bool) {
          // Current value is already added in the balance, reduce it
        uint _sharePrice;

        if(totalSupply_ > 0) {
            _sharePrice = getPrice() - ( (msg.value * 10 ** decimals ) / totalSupply_);
         } else {
            _sharePrice = INITIAL_VALUE;
        }


        uint _investorShare = ( ( (msg.value) * DENOMINATOR) / _sharePrice) * 10 ** decimals;
        _investorShare = _investorShare / DENOMINATOR;

        balances[msg.sender] += _investorShare;
        totalSupply_ += _investorShare;

        emit Invested(msg.sender, _investorShare);
        return true;
    }

    function getTokens() external view returns(address[], uint[]) {
        uint[] memory _amounts = new uint[](tokens.length);
        for (uint i = 0; i < tokens.length; i++) {
            _amounts[i] = amounts[tokens[i]];
        }
        return (tokens, _amounts);
    }

    function getPrice() public view returns(uint)  {
        if(totalSupply_ == 0) {
            return INITIAL_VALUE;
        }

        // Total Value in ETH among its tokens + ETH new added value
        return (
          ((getAssetsValue() + address(this).balance ) * 10 ** decimals ) / (totalSupply_),
        );
    }

    function getAssetsValue() internal view returns (uint) {
        OlympusExchangeInterface exchangeProvider = OlympusExchangeInterface(getComponentByName(EXCHANGE));
        uint _totalTokensValue = 0;
        // Iterator
        uint _expectedRate;
        uint _balance;

        for (uint i = 0; i < tokens.length; i++) {
            if(!activeTokens[tokens[i]]) {continue;}
            _balance = ERC20(tokens[i]).balanceOf(address(this));

            if(_balance == 0){continue;}

            (_expectedRate, ) = exchangeProvider.getPrice(ETH,ERC20Extended(tokens[i]), 10**18, 0x0);

            if(_expectedRate == 0){continue;}
            _totalTokensValue += (_balance * 10**18) / _expectedRate;

        }
        return _totalTokensValue;
    }


  // Mock
    function requestWithdraw(uint amount) external {
        require(investors[msg.sender] >= amount);
        msg.sender.transfer(amount);
        investors[msg.sender] -= amount;
        totalSupply_ -= amount;
    }
}
