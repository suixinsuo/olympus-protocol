pragma solidity ^0.4.23;
import "../libs/SafeMath.sol";
import "../permission/PermissionProviderInterface.sol";
import "../price/PriceProviderInterface.sol";
import "../libs/ERC20.sol";
import "../libs/strings.sol";
import "../libs/Converter.sol";
import "../riskManagement/RiskManagementProviderInterface.sol";

contract IndexTemplate {
    using strings for *;
    using SafeMath for uint256;
    //Permission Control
    PermissionProviderInterface internal permissionProvider;
    //Price
    PriceProviderInterface internal PriceProvider;
    // Risk Provider
    RiskManagementProviderInterface internal riskProvider;
    //ERC20
    ERC20 internal erc20Token;

    //enum
    enum IndexStatus { Paused, Closed , Active }

    uint256 public totalSupply;
    string public name;
    string public description;
    string public category;
    uint256 public decimals;
    string public symbol;
    address public owner;
    address[] public indexTokenAddresses;
    uint8[] public indexTokenWeights;

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    /**
    Start Rebalance parameters
     */
    enum RebalanceStatus {
        INACTIVE,
        INITIATED,
        READY_TO_TRADE,
        SELLING_IN_PROGRESS,
        SELLING_COMPLETE,
        BUYING_IN_PROGRESS,
        BUYING_COMPLETE
    }
    RebalanceStatus private rebalanceStatus = RebalanceStatus.INACTIVE;
    uint private tokenStep = 10;
    uint private rebalancingTokenProgress;
    uint private PERCENTAGE_DENOMINATOR = 10000;
    uint private rebalanceDeltaPercentage = 30; // 0.3%
    uint private lastRebalance;
    uint private rebalanceInterval = 0;
    uint private ethValueRebalanceStart;
    uint private rebalanceSoldTokensETHReceived;
    struct RebalanceToken {
        address tokenAddress;
        uint tokenWeight;
        uint amount;
    }
    RebalanceToken[] public rebalanceTokensToSell;
    RebalanceToken[] public rebalanceTokensToBuy;
    /**
    End Rebalance parameters
     */

    constructor (
        string _symbol, string _name, string _category, string _description,
        uint _decimals, address[] _indexTokenAddresses, uint8[] _indexTokenWeights,
        uint _rebalanceInterval) public {
        require(_decimals <= 18, "Too many decimals, should be equal to or less than 18");
        decimals = _decimals;
        symbol = _symbol;
        name = _name;
        category = _category;
        description = _description;
        owner = msg.sender;
        indexTokenAddresses = _indexTokenAddresses;
        indexTokenWeights = _indexTokenWeights;
        totalSupply = 0;
        lastRebalance = now;
        rebalanceInterval = _rebalanceInterval;
    }

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    // Fix for short address attack against ERC20
    // https://vessenes.com/the-erc20-short-address-attack-explained/
    modifier onlyPayloadSize(uint size) {
        require(msg.data.length == size + 4);
        _;
    }

    modifier withNoRisk(address _from, address _to, uint256 _value) {
        assert(
            !riskProvider.hasRisk(
               _from, _to, address(this), _value, 0 // Price not required
            ));
        _;
    }

    function balanceOf(address _owner) view public returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _recipient, uint256 _value)
      onlyPayloadSize(2*32)
      withNoRisk(msg.sender,_recipient, _value)
      public returns(bool success) {

        require(balances[msg.sender] >= _value, "Your balance is not enough");
        require(_value > 0, "Value needs to be greater than 0");
        balances[msg.sender] -= _value;
        balances[_recipient] += _value;
        emit Transfer(msg.sender, _recipient, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value)
      withNoRisk(_from,_to, _value)
      public returns(bool success){
        require(balances[_from] >= _value, "Your balance is not enough");
        require(allowed[_from][msg.sender] >= _value, "Not enough balance is allowed");
        require(_value > 0, "Value needs to be greater than 0");
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns(bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) view public returns (uint256) {
        return allowed[_owner][_spender];
    }

    // -------------------------- PROVIDER --------------------------
    function setPermissionProvider(address _permissionAddress) public onlyOwner {
        permissionProvider = PermissionProviderInterface(_permissionAddress);
    }

    function setPriceProvider(address _priceAddress) public onlyOwner {
        PriceProvider = PriceProviderInterface(_priceAddress);
    }

    function setRiskProvider(address _riskProvider) public onlyOwner {
        riskProvider = RiskManagementProviderInterface(_riskProvider);
    }

    /**
    Start Rebalance Functions
    */
    function rebalancePrepareSellAndBuy() private returns (bool success){
        if(rebalanceStatus == RebalanceStatus.INITIATED){
            uint totalIndexValue = getTotalIndexValue();
            uint i;
            for(i = 0; i < tokenAddresses.length; i++) {
                // Get the amount of tokens expected for 1 ETH
                uint ETHTokenPrice = mockCoreGetPrice(ETH_TOKEN, tokenAddresses[i]);
                if(ETHTokenPrice == 0){
                    emit LogString("Error", "Price provider doesn't support this tokenIndex: ".toSlice().concat(Converter.bytes32ToString(bytes32(i)).toSlice()));
                }
                uint currentTokenBalance = ERC20(tokenAddresses[i]).balanceOf(address(this)); //
                uint shouldHaveAmountOfTokensInETH = (totalIndexValue * tokenWeights[i]) / 100;
                uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

                // minus delta
                if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToSell.push(RebalanceToken({
                        tokenAddress: tokenAddresses[i],
                        tokenWeight: tokenWeights[i],
                        amount: currentTokenBalance - shouldHaveAmountOfTokens
                    }));
                // minus delta
                } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
                    rebalanceTokensToBuy.push(RebalanceToken({
                        tokenAddress: tokenAddresses[i],
                        tokenWeight: tokenWeights[i],
                        // Convert token balance to ETH price (because we need to send ETH), taking into account the decimals of the token
                        amount: ((shouldHaveAmountOfTokens - currentTokenBalance) * 10**18) / ETHTokenPrice
                        // amount: shouldHaveAmountOfTokensInETH - (currentTokenBalance * (10**ERC20(tokenAddresses[i]).decimals()) / ETHTokenPrice)
                    }));
                }
            //TODO Does this run out of gas for 100 tokens?
            }
            rebalanceStatus = RebalanceStatus.READY_TO_TRADE;
        }
        return true;
    }

    function rebalance() public returns (bool success){
        // solium-disable-next-line security/no-block-members
        require(lastRebalance + rebalanceInterval <= now, "Time is not here yet");
        if(rebalanceStatus == RebalanceStatus.INACTIVE){
            ethValueRebalanceStart = address(this).balance;
            delete rebalanceTokensToSell;
            delete rebalanceTokensToBuy;
            rebalanceStatus = RebalanceStatus.INITIATED;
        }
        uint i;
        uint currentProgress = rebalancingTokenProgress;
        require(rebalancePrepareSellAndBuy(), "Prepare sell and buy failed");

        if(rebalanceStatus == RebalanceStatus.READY_TO_TRADE || rebalanceStatus == RebalanceStatus.SELLING_IN_PROGRESS){
            rebalanceStatus = RebalanceStatus.SELLING_IN_PROGRESS;
            // First sell tokens
            for(i = currentProgress; i < rebalanceTokensToSell.length; i++){
                if(i > currentProgress + tokenStep){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    return false;
                }
                // TODO approve token transfers (depending on exchange implementation)
                require(mockCoreExchange(rebalanceTokensToSell[i].tokenAddress,ETH_TOKEN,rebalanceTokensToSell[i].amount), "Exchange sale failed");
                rebalancingTokenProgress++;
                if(i == rebalanceTokensToSell.length - 1){
                    rebalanceStatus = RebalanceStatus.SELLING_COMPLETE;
                }
            }
        }


        if(rebalanceStatus == RebalanceStatus.SELLING_COMPLETE){
            rebalanceSoldTokensETHReceived = address(this).balance - ethValueRebalanceStart;
            rebalanceStatus = RebalanceStatus.BUYING_IN_PROGRESS;
        }

        // Then buy tokens
        if(rebalanceStatus == RebalanceStatus.BUYING_IN_PROGRESS){
            uint sellTxs = rebalancingTokenProgress - currentProgress;
            rebalancingTokenProgress = 0;
            uint assumedAmountOfEthToBuy;
            uint differencePercentage;
            bool surplus;

            // Get the total amount of ETH that we are supposed to buy
            for(i = 0; i < rebalanceTokensToBuy.length; i++){
                assumedAmountOfEthToBuy += rebalanceTokensToBuy[i].amount;
            }

            // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
            // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
            if(assumedAmountOfEthToBuy > rebalanceSoldTokensETHReceived){
                differencePercentage = ((assumedAmountOfEthToBuy - rebalanceSoldTokensETHReceived) * PERCENTAGE_DENOMINATOR) / assumedAmountOfEthToBuy;
            } else if (assumedAmountOfEthToBuy < rebalanceSoldTokensETHReceived){
                surplus = true;
                differencePercentage = ((rebalanceSoldTokensETHReceived - assumedAmountOfEthToBuy) * PERCENTAGE_DENOMINATOR) / rebalanceSoldTokensETHReceived;
            } else {
                differencePercentage = 0;
            }

            for(i = rebalancingTokenProgress; i < rebalanceTokensToBuy.length; i++){

                if(i + sellTxs > currentProgress + tokenStep){
                    // Safety measure for gas
                    // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
                    // Also take into account the number of sellTxs that have happened in the current function call
                    return false;
                }
                uint slippage;

                if(differencePercentage > 0){
                    // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
                    slippage = (rebalanceTokensToBuy[i].amount * differencePercentage) / PERCENTAGE_DENOMINATOR;
                }
                if(surplus == true){
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount + slippage), "Exchange buy failed");
                } else {
                    require(mockCoreExchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount - slippage), "Exchange buy failed");
                }
                rebalancingTokenProgress++;
                if(i == rebalanceTokensToBuy.length - 1){
                    rebalanceStatus = RebalanceStatus.BUYING_COMPLETE;
                }
            }

        }
        if(rebalanceStatus == RebalanceStatus.BUYING_COMPLETE){
            // Yay, done! Reset everything, ready for the next time
            // solium-disable-next-line security/no-block-members
            lastRebalance = now;
            rebalanceStatus = RebalanceStatus.INACTIVE;
            rebalancingTokenProgress = 0;
            return true;
        }
        return false;
    }

    /**
    End Rebalance Functions
    */

	  // Event which is triggered to log all transfers to this contract's event log
    event Transfer(
      address indexed _from,
      address indexed _to,
      uint256 _value
    );

  	// Event which is triggered whenever an owner approves a new allowance for a spender.
    event Approval(
      address indexed _owner,
      address indexed _spender,
      uint256 _value
    );
}
