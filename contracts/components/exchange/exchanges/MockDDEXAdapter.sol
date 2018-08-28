pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../interfaces/implementations/KyberNetworkInterface.sol";
import "../../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../../libs/ERC20Extended.sol";
import "../../../libs/ERC20NoReturn.sol";

contract MockDDEXAdapter is OlympusExchangeAdapterInterface{
    using SafeMath for uint256;

    KyberNetworkInterface public kyber;
    address public exchangeAdapterManager;
    address public exchangeProvider;
    bytes32 public exchangeId;
    bytes32 public name;
    ERC20Extended public constant ETH_TOKEN_ADDRESS = ERC20Extended(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    address public walletId = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;

    bool public adapterEnabled;

    modifier onlyExchangeAdapterManager() {
        require(msg.sender == address(exchangeAdapterManager));
        _;
    }

    constructor (KyberNetworkInterface _kyber, address _exchangeAdapterManager, address _exchangeProvider) public {
        require(address(_kyber) != 0x0);
        kyber = _kyber;
        exchangeAdapterManager = _exchangeAdapterManager;
        exchangeProvider = _exchangeProvider;
        adapterEnabled = true;
    }

    function setExchangeAdapterManager(address _exchangeAdapterManager) external onlyOwner{
        exchangeAdapterManager = _exchangeAdapterManager;
    }

    function setExchangeProvider(address _exchangeProvider) external onlyOwner{
        exchangeProvider = _exchangeProvider;
    }

    function setExchangeDetails(bytes32 _id, bytes32 _name)
    external onlyExchangeAdapterManager returns(bool)
    {
        exchangeId = _id;
        name = _name;
        return true;
    }

    function getExchangeDetails()
    external view returns(bytes32 _name, bool _enabled)
    {
        return (name, adapterEnabled);
    }

    function getExpectAmount(uint eth, uint destDecimals, uint rate) internal pure returns(uint){
        return Utils.calcDstQty(eth, 18, destDecimals, rate);
    }

    function tokenExchange(ERC20Extended _src, ERC20Extended _dest, uint _amount, uint _minimumRate, address _depositAddress)
    external payable returns(bool success){
        return false;
    }
    function configAdapter(KyberNetworkInterface _kyber, address _walletId) external onlyOwner returns(bool success) {
        if(address(_kyber) != 0x0){
            kyber = _kyber;
        }
        if(_walletId != 0x0){
            walletId = _walletId;
        }
        return true;
    }

    function supportsTradingPair(address _srcAddress, address _destAddress) external view returns(bool supported){
        // Get price for selling one
        uint amount = ERC20Extended(_srcAddress) == ETH_TOKEN_ADDRESS ? 10**18 : 10**ERC20Extended(_srcAddress).decimals();
        uint price;
        (price,) = this.getPrice(ERC20Extended(_srcAddress), ERC20Extended(_destAddress), amount);
        return price > 0;
    }

    function enable() external onlyOwner returns(bool){
        adapterEnabled = true;
        return true;
    }

    function disable() external onlyOwner returns(bool){
        adapterEnabled = false;
        return true;
    }

    function isEnabled() external view returns (bool success) {
        return adapterEnabled;
    }

    function getPrice(ERC20Extended _sourceAddress, ERC20Extended _destAddress, uint _amount) external view returns(uint, uint){
        return kyber.getExpectedRate(_sourceAddress, _destAddress, _amount);
    }

    function buyToken(ERC20Extended _token, uint _amount, uint _minimumRate, address _depositAddress)
    external payable returns(bool) {
        if (address(this).balance < _amount) {
            return false;
        }
        require(msg.value == _amount);
        uint slippageRate;

        (, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, _token, _amount);
        if(slippageRate < _minimumRate){
            return false;
        }

        uint beforeTokenBalance = _token.balanceOf(_depositAddress);
        slippageRate = _minimumRate;
        kyber.trade.value(msg.value)(
            ETH_TOKEN_ADDRESS,
            _amount,
            _token,
            _depositAddress,
            2**256 - 1,
            slippageRate,
            walletId);

        require(_token.balanceOf(_depositAddress) > beforeTokenBalance);

        return true;
    }
    function sellToken(ERC20Extended _token, uint _amount, uint _minimumRate, address _depositAddress)
    external returns(bool success)
    {
        ERC20NoReturn(_token).approve(address(kyber), 0);
        ERC20NoReturn(_token).approve(address(kyber), _amount);
        uint slippageRate;
        (,slippageRate) = kyber.getExpectedRate(_token, ETH_TOKEN_ADDRESS, _amount);

        if(slippageRate < _minimumRate){
            return false;
        }
        slippageRate = _minimumRate;

        // uint beforeTokenBalance = _token.balanceOf(this);
        kyber.trade(
            _token,
            _amount,
            ETH_TOKEN_ADDRESS,
            _depositAddress,
            2**256 - 1,
            slippageRate,
            walletId);

        // require(_token.balanceOf(this) < beforeTokenBalance);
        // require((beforeTokenBalance - _token.balanceOf(this)) == _amount);

        return true;
    }

    function approveToken(ERC20Extended _token) external returns(bool success){
        ERC20NoReturn(_token).approve(exchangeProvider,0);
        ERC20NoReturn(_token).approve(exchangeProvider,2**255);
        return true;
    }

    function withdraw(uint amount) external onlyOwner {

        require(amount <= address(this).balance);

        uint sendAmount = amount;
        if (amount == 0){
            sendAmount = address(this).balance;
        }
        msg.sender.transfer(sendAmount);
    }

}
