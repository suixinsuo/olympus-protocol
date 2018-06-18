pragma solidity 0.4.24;

import "../../../interfaces/implementations/OlympusExchangeAdapterInterface.sol";
import "../../../libs/ERC20.sol";

contract KyberNetworkAdapter is OlympusExchangeAdapterInterface {

    KyberNetworkInterface private kyber;
    address private exchangeAdapterManager;
    bytes32 private exchangeId;
    bytes32 private name;
    ERC20 private constant ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    address private walletId = 0x09227deaeE08a5Ba9D6Eb057F922aDfAd191c36c;

    bool public adapterEnabled;

    modifier onlyExchangeAdapterManager() {
        require(msg.sender == address(exchangeAdapterManager));
        _;
    }

    constructor (KyberNetworkInterface _kyber) public {
        require(address(_kyber) != 0x0);
        kyber = _kyber;
        adapterEnabled = true;
    }

    function setExchangeAdapterManager(address _exchangeAdapterManager) external onlyOwner{
        exchangeAdapterManager = _exchangeAdapterManager;
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
        uint amount = 10**(ERC20(_srcAddress) == ETH_TOKEN_ADDRESS ? 18 : ERC20(_srcAddress).decimals());
        uint price;
        (price,) = this.getPrice(ERC20(_srcAddress), ERC20(_destAddress), amount);
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

    function getPrice(ERC20 _sourceAddress, ERC20 _destAddress, uint _amount) external view returns(uint, uint){
        return kyber.getExpectedRate(_sourceAddress, _destAddress, _amount);
    }

    function buyToken(ERC20 _token, uint _amount, uint _minimumRate, address _depositAddress, address _partnerId)
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
            _partnerId == address(0x0) ? walletId : _partnerId);

        require(_token.balanceOf(_depositAddress) > beforeTokenBalance);

        return true;
    }
    function sellToken(ERC20 _token, uint _amount, uint _minimumRate, address _depositAddress, address _partnerId)
    external returns(bool success)
    {
        _token.approve(address(kyber), _amount);

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
            _partnerId == address(0x0) ? walletId : _partnerId);

        // require(_token.balanceOf(this) < beforeTokenBalance);
        // require((beforeTokenBalance - _token.balanceOf(this)) == _amount);

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
