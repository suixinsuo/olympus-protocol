pragma solidity ^0.4.19;
// pragma experimental ABIEncoderV2;

import "./libs/Manageable.sol";
import "./libs/SafeMath.sol";
import "./libs/Converter.sol";
import "./exchange/ExchangeProviderInterface.sol";
import "./price/PriceProviderInterface.sol";
import "./strategy/StrategyProviderInterface.sol";
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

    ExchangeProviderInterface internal exchangeProvider =  ExchangeProviderInterface(address(0x864071486f4C71C7988b53DCEe1f7cEffa57EFcC));
    StrategyProviderInterface internal strategyProvider = StrategyProviderInterface(address(0x49341fa51c75e66ea57e5b4eb99ca4d3608c5201));
    PriceProviderInterface internal priceProvider = PriceProviderInterface(address(0x88c80FcaAE06323e17DDCD4ff8E0Fbe06D9799e6));
    OlympusStorageInterface internal olympusStorage = OlympusStorageInterface(address(0xc82cCeEF63e095A56D6Bb0C17c1F3ec58567aF1C));
    uint public feePercentage = 100;
    uint public constant DENOMINATOR = 10000;

    uint public minimumInWei = 0;
    uint public maximumInWei;

    modifier allowProviderOnly(TD.ProviderType _type) {
        require(msg.sender == subContracts[uint8(_type)]);
        _;
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
    function getPrice(address tokenAddress) public view returns (uint price){
        require(tokenAddress != address(0));
        return priceProvider.getNewDefaultPrice(tokenAddress);
    }

    function getStragetyTokenPrice(uint strategyId, uint tokenIndex) public view returns (uint price) {
        require(strategyId >= 0);
        uint totalLength;

        (,,,,,totalLength) = getStrategy(strategyId);
        require(tokenIndex < totalLength);

        address token;
        (token,) = getStrategyTokenAndWeightByIndex(strategyId, tokenIndex);

        return getPrice(token);
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

    function buyIndex(uint strategyId, address depositAddress) public payable returns (uint indexOrderId)
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
        amounts[1] = getFeeAmount(amounts[0]); // fee
        amounts[2] = amounts[0] - amounts[1]; // actualAmount

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
        // 2: dealtPrices
        // 3: completedTokenAmounts

        address[] memory tokens = new address[](tokenLength);
        uint[] memory weights = new uint[](tokenLength);

        subOrderTemp[0] = initializeArray(tokenLength);
        subOrderTemp[1] = initializeArray(tokenLength);
        subOrderTemp[2] = initializeArray(tokenLength);
        subOrderTemp[3] = initializeArray(tokenLength);

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
            subOrderTemp[1][i] = getPrice(tokens[i]);

            olympusStorage.addTokenDetails(
                indexOrderId,
                tokens[i], weights[i], subOrderTemp[0][i],
                subOrderTemp[1][i], subOrderTemp[2][i], subOrderTemp[3][i]
            );

            emit LogAddress(tokens[i]);
            emit LogNumber(subOrderTemp[0][i]);
            emit LogNumber(subOrderTemp[1][i]);
            require(exchangeProvider.addPlaceOrderItem(indexOrderId, ERC20(tokens[i]), subOrderTemp[0][i], subOrderTemp[1][i]));
        }

        strategyProvider.updateFollower(strategyId, true);

        emit LogNumber(amounts[2]);
        require((exchangeProvider.endPlaceOrder.value(amounts[2])(indexOrderId)));

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

    function getFeeAmount(uint amountInWei) private view returns (uint){
        return amountInWei * feePercentage / DENOMINATOR;
    }
}
