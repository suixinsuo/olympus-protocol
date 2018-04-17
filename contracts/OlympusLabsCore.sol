pragma solidity ^0.4.19;
// pragma experimental ABIEncoderV2;

import "./libs/Manageable.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";
import "./exchange/ExchangeProviderInterface.sol";
import "./price/PriceProviderInterface.sol";
import "./strategy/StrategyProviderInterface.sol";
import "./permission/PermissionProviderInterface.sol";
import { StorageTypeDefinitions as STD, OlympusStorageInterface } from "./storage/OlympusStorage.sol";
import { TypeDefinitions as TD, Provider } from "./libs/Provider.sol";


contract OlympusLabsCore is Manageable {
    using SafeMath for uint256;

    event IndexOrderUpdated (uint orderId);
    event Log(string message);
    event LogNumber(uint number);
    event LogAddress(address message);
    event LogAddresses(address[] message);
    event LogNumbers(uint[] numbers);

    ExchangeProviderInterface internal exchangeProvider =  ExchangeProviderInterface(address(0x9FC2267BeE84E56Fab30637dB70f9ceB0bCaDFD0));
    StrategyProviderInterface internal strategyProvider = StrategyProviderInterface(address(0x296b6FE67B9ee209B360a52fDFB67fbe4C14e952));
    PriceProviderInterface internal priceProvider = PriceProviderInterface(address(0x51e404a62CA2874398525C61366E2E914e3657Ab));
    OlympusStorageInterface internal olympusStorage = OlympusStorageInterface(address(0xc82cCeEF63e095A56D6Bb0C17c1F3ec58567aF1C));
    ERC20 private MOT = ERC20(address(0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a));
    // TODO, update for mainnet: 0x263c618480DBe35C300D8d5EcDA19bbB986AcaeD

    uint public feePercentage = 100;
    uint public constant DENOMINATOR = 10000;

    uint public minimumInWei = 0;
    uint public maximumInWei;

    modifier allowProviderOnly(TD.ProviderType _type) {
        require(msg.sender == subContracts[uint8(_type)]);
        _;
    }

    modifier onlyOwner() {
        require(permissionProvider.hasPriceOwner(msg.sender));
        _;
    }

    PermissionProviderInterface internal permissionProvider;

    function OlympusLabsCore(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }

    function() payable public {
        revert();
    }

    // Forward to Strategy smart contract.
    function getStrategyCount() public view returns (uint length)
    {
        return strategyProvider.getStrategyCount();
    }

    function getStrategy(uint strategyId) public view returns (
        string name,
        string description,
        string category,
        uint followers,
        uint amount,
        string exchangeName,
        uint tokenLength)
    {

        require(strategyId >= 0);

        bytes32[4] memory bytesTemp;

        (,bytesTemp[0], bytesTemp[1], bytesTemp[2], followers, amount, bytesTemp[3]) = strategyProvider.getStrategy(strategyId);
        name = Converter.bytes32ToString(bytesTemp[0]);
        description = Converter.bytes32ToString(bytesTemp[1]);
        category = Converter.bytes32ToString(bytesTemp[2]);
        exchangeName = Converter.bytes32ToString(bytesTemp[3]);

        tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
    }

    function getStrategyTokenAndWeightByIndex(uint strategyId, uint index) public view returns (
        address token,
        uint weight
        )
    {
        require(strategyId >= 0);

        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);
        require(index < tokenLength);

        (token, weight) = strategyProvider.getStrategyTokenByIndex(strategyId, index);
    }

    // Forward to Price smart contract.
    function getPrice(address tokenAddress, uint srcQty) public view returns (uint price){
        require(tokenAddress != address(0));
        (, price) = priceProvider.getrates(tokenAddress, srcQty);
        return price;
    }

    function getStragetyTokenPrice(uint strategyId, uint tokenIndex) public view returns (uint price) {
        require(strategyId >= 0);
        uint totalLength;

        (,,,,,totalLength) = getStrategy(strategyId);
        require(tokenIndex < totalLength);

        address token;
        (token,) = getStrategyTokenAndWeightByIndex(strategyId, tokenIndex);

        //Default get the price for one Ether
        return getPrice(token, 10**18);
    }

    function setProvider(uint8 _id, address _providerAddress) public onlyOwner returns (bool success) {
        bool result = super.setProvider(_id, _providerAddress);
        TD.ProviderType _type = TD.ProviderType(_id);

        if(_type == TD.ProviderType.Strategy) {
            emit Log("StrategyProvider");
            strategyProvider = StrategyProviderInterface(_providerAddress);
        } else if(_type == TD.ProviderType.Exchange) {
            emit Log("ExchangeProvider");
            exchangeProvider = ExchangeProviderInterface(_providerAddress);
        } else if(_type == TD.ProviderType.Price) {
            emit Log("PriceProvider");
            priceProvider = PriceProviderInterface(_providerAddress);
        } else if(_type == TD.ProviderType.Storage) {
            emit Log("StorageProvider");
            olympusStorage = OlympusStorageInterface(_providerAddress);
          } else {
            emit Log("Unknown provider type supplied.");
            revert();
        }

        return result;
    }

    function buyIndex(uint strategyId, address depositAddress, bool feeIsMOT) public payable returns (uint indexOrderId)
    {
        require(msg.value > minimumInWei);
        if(maximumInWei > 0){
            require(msg.value <= maximumInWei);
        }
        string memory exchangeName;
        (,,,,,exchangeName,) = getStrategy(strategyId);
        uint tokenLength = strategyProvider.getStrategyTokenCount(strategyId);

        // can't buy an index without tokens.
        require(tokenLength > 0);

        uint[3] memory amounts;
        amounts[0] = msg.value; //uint totalAmount
        amounts[1] = getFeeAmount(amounts[0], feeIsMOT); // fee
        amounts[2] = payFee(amounts[0], amounts[1], msg.sender, feeIsMOT);

        bytes32 exchangeId = Converter.stringToBytes32(exchangeName);

        // create order.
        indexOrderId = olympusStorage.addOrderBasicFields(
          strategyId,
          msg.sender,
          amounts[0],
          amounts[1],
          exchangeId
        );

        uint[][4] memory subOrderTemp;
        // 0: token amounts
        // 1: estimatedPrices

        address[] memory tokens = new address[](tokenLength);
        uint[] memory weights = new uint[](tokenLength);

        subOrderTemp[0] = initializeArray(tokenLength);
        subOrderTemp[1] = initializeArray(tokenLength);

        emit LogNumber(indexOrderId);
        require(exchangeProvider.startPlaceOrder(indexOrderId, depositAddress));
        for (uint i = 0; i < tokenLength; i ++ ) {
            (tokens[i],weights[i]) = getStrategyTokenAndWeightByIndex(strategyId, i);
            // ignore those tokens with zero weight.
            if(weights[i] <= 0) {
                continue;
            }
            // token has to be supported by exchange provider.
            if(!exchangeProvider.checkTokenSupported(ERC20(tokens[i]))){
                emit Log("Exchange provider doesn't support");
                revert();
            }

            // check if price provider supports it.
            if(!priceProvider.checkTokenSupported(tokens[i])){
                emit Log("Price provider doesn't support");
                revert();
            }

            subOrderTemp[0][i] = amounts[2] * weights[i] / 100;
            subOrderTemp[1][i] = getPrice(tokens[i], subOrderTemp[0][i]);

            emit LogAddress(tokens[i]);
            emit LogNumber(subOrderTemp[0][i]);
            emit LogNumber(subOrderTemp[1][i]);
            require(exchangeProvider.addPlaceOrderItem(indexOrderId, ERC20(tokens[i]), subOrderTemp[0][i], subOrderTemp[1][i]));
        }

        olympusStorage.addTokenDetails(
            indexOrderId,
            tokens, weights, subOrderTemp[0], subOrderTemp[1]
        );

        emit LogNumber(amounts[2]);
        require((exchangeProvider.endPlaceOrder.value(amounts[2])(indexOrderId)));

        strategyProvider.updateFollower(strategyId, true);

        // todo: send ethers to the clearing center.
        return indexOrderId;
    }

    function initializeArray(uint length) private pure returns (uint[]){
        return new uint[](length);
    }

    function resetOrderIdTo(uint _start) external onlyOwner returns (uint) {
        return olympusStorage.resetOrderIdTo(_start);
    }

    // For app/3rd-party clients to check details / status.
    function getIndexOrder(uint _orderId) public view returns
    (uint[])
    {
        // 0 strategyId
        // 1 dateCreated
        // 2 dateCompleted
        // 3 amountInWei
        // 4 tokenLength
        uint[] memory orderPartial = new uint[](5);
        address[] memory buyer = new address[](1);
        bytes32[] memory exchangeId = new bytes32[](1);
        STD.OrderStatus[] memory status = new STD.OrderStatus[](1);

        // Stack too deep, so should be split up
        (orderPartial[0], buyer[0], status[0], orderPartial[1]) = olympusStorage.getIndexOrder1(_orderId);
        (orderPartial[2], orderPartial[3], orderPartial[4], exchangeId[0]) = olympusStorage.getIndexOrder2(_orderId);
        address[] memory tokens = new address[](orderPartial[4]);

        for(uint i = 0; i < orderPartial[4]; i++){
            tokens[i] = olympusStorage.getIndexToken(_orderId, i);
        }
        return (
          orderPartial
        );
    }

    function updateIndexOrderToken(
        uint _orderId,
        address _tokenAddress,
        uint _actualPrice,
        uint _totalTokenAmount,
        uint _completedQuantity
    ) external allowProviderOnly(TD.ProviderType.Exchange) returns (bool success)
    {
        uint completedTokenAmount;
        uint tokenIndex;
        (completedTokenAmount, tokenIndex) = olympusStorage.getOrderTokenCompletedAmount(_orderId,_tokenAddress);

        ExchangeProviderInterface.MarketOrderStatus status;

        if(completedTokenAmount == 0 && _completedQuantity < completedTokenAmount){
            status = ExchangeProviderInterface.MarketOrderStatus.PartiallyCompleted;
        }

        if(_completedQuantity >= completedTokenAmount){
            status = ExchangeProviderInterface.MarketOrderStatus.Completed;
        }
        olympusStorage.updateIndexOrderToken(_orderId, tokenIndex, _totalTokenAmount, _actualPrice, _completedQuantity, status);

        return true;
    }

    function updateOrderStatus(uint _orderId, STD.OrderStatus _status)
        external allowProviderOnly(TD.ProviderType.Exchange)
        returns (bool success)
    {
        olympusStorage.updateOrderStatus(_orderId, _status);

        return true;
    }

    function getSubOrderStatus(uint _orderId, address _tokenAddress)
        external view returns (ExchangeProviderInterface.MarketOrderStatus)
    {
        return exchangeProvider.getSubOrderStatus(_orderId, ERC20(_tokenAddress));
    }

    function adjustFee(uint _newFeePercentage) public onlyOwner returns (bool success) {
        feePercentage = _newFeePercentage;
        return true;
    }

    function adjustTradeRange(uint _minInWei, uint _maxInWei) public onlyOwner returns (bool success) {
        require(_minInWei > 0);
        require(_maxInWei > _minInWei);
        minimumInWei = _minInWei;
        maximumInWei = _maxInWei;

        return true;
    }

    function getFeeAmount(uint amountInWei, bool feeIsMOT) private view returns (uint){
        if(feeIsMOT){
            return amountInWei * feePercentage / DENOMINATOR;
        } else {
            return amountInWei * feePercentage / DENOMINATOR;
        }
    }

    function payFee(uint totalValue, uint feeValue, address sender, bool feeIsMOT) private view returns (uint){
        if(feeIsMOT){
            // Transfer MOT
            // uint amount;
            // uint allowance = MOT.allowance(sender,address(this));
            // (,amount) = priceProvider.getrates(address(0xea1887835d177ba8052e5461a269f42f9d77a5af), feeValue);
            // require(allowance >= amount);
            // require(MOT.transferFrom(sender,address(this),amount));
            return totalValue; // Use all sent ETH to buy, because fee is paid in MOT
        } else { // We use ETH as fee, so deduct that from the amount of ETH sent
            return totalValue - feeValue;
        }
    }
}
