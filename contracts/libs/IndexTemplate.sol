pragma solidity ^0.4.23;

contract IndexTemplate {
    
}
// import "../libs/SafeMath.sol";
// import "../permission/PermissionProviderInterface.sol";
// import "../price/PriceProviderInterface.sol";
// import "../libs/ERC20.sol";
// import "../libs/strings.sol";
// import "../libs/Converter.sol";
// import "../libs/Reimbursable.sol";
// import "../riskManagement/RiskManagementProviderInterface.sol";
// import "./CoreInterface.sol";

// contract IndexTemplate is Reimbursable {
//     using strings for *;
//     using SafeMath for uint256;

//     event LogString(string desc, string value);

//     //Permission Control
//     PermissionProviderInterface internal permissionProvider;
//     //Price
//     PriceProviderInterface internal priceProvider;
//     //Risk Provider
//     RiskManagementProviderInterface internal riskProvider;
//     CoreInterface internal core;

//     //enum
//     enum IndexStatus { Paused, Closed , Active }

//     uint256 public totalSupply;
//     string public name;
//     string public description;
//     string public category;
//     uint256 public decimals;
//     string public symbol;
//     address public owner;
//     address[] public indexTokenAddresses;
//     uint8[] public indexTokenWeights;
//     IndexStatus public indexStatus;
//     // Fee
//     uint256 pendingOwnerFee;
//     uint256 indexManagmentFee;
//     uint withdrawedFee;

//     mapping (address => uint256) balances;
//     mapping (address => mapping (address => uint256)) allowed;

//     /**
//     Start Rebalance parameters
//      */
//     enum RebalanceStatus {
//         INACTIVE,
//         INITIATED,
//         READY_TO_TRADE,
//         SELLING_IN_PROGRESS,
//         SELLING_COMPLETE,
//         BUYING_IN_PROGRESS,
//         BUYING_COMPLETE
//     }
//     RebalanceStatus private rebalanceStatus = RebalanceStatus.INACTIVE;
//     uint private tokenStep = 10;
//     uint private rebalancingTokenProgress;
//     uint private PERCENTAGE_DENOMINATOR = 10000;
//     uint private rebalanceDeltaPercentage = 30; // 0.3%
//     uint private lastRebalance;
//     uint private rebalanceInterval = 0;
//     uint private ethValueRebalanceStart;
//     uint private rebalanceSoldTokensETHReceived;
//     struct RebalanceToken {
//         address tokenAddress;
//         uint tokenWeight;
//         uint amount;
//     }
//     RebalanceToken[] public rebalanceTokensToSell;
//     RebalanceToken[] public rebalanceTokensToBuy;
//     address constant private ETH_TOKEN = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
//     string public constant TYPE = "INDEX";
//     string public constant version = "0.1";

//     /**
//     End Rebalance parameters
//      */

//     constructor (
//         string _symbol, string _name, string _category, string _description,
//         uint _decimals, address[] _indexTokenAddresses, uint8[] _indexTokenWeights,
//         uint _rebalanceInterval) public {
//         require(_decimals <= 18, "Too many decimals, should be equal to or less than 18");
//         decimals = _decimals;
//         symbol = _symbol;
//         name = _name;
//         category = _category;
//         description = _description;
//         owner = msg.sender;
//         indexTokenAddresses = _indexTokenAddresses;
//         indexTokenWeights = _indexTokenWeights;
//         totalSupply = 0;
//         // solium-disable-next-line security/no-block-members
//         lastRebalance = now;
//         rebalanceInterval = _rebalanceInterval;
//         indexStatus = IndexStatus.Active;
//     }

//     modifier onlyOwner(){
//         require(msg.sender == owner);
//         _;
//     }

//     // Fix for short address attack against ERC20
//     // https://vessenes.com/the-erc20-short-address-attack-explained/
//     modifier onlyPayloadSize(uint size) {
//         require(msg.data.length == size + 4);
//         _;
//     }

//     modifier withNoRisk(address _from, address _to, address _tokenAddress, uint256 _value) {
//         require(
//             !riskProvider.hasRisk(
//                 _from, _to, _tokenAddress, _value, 0 // Price not required
//             ),
//             "The transaction is risky");
//         _;
//     }

//     function balanceOf(address _owner) view public returns (uint256) {
//         return balances[_owner];
//     }

//     function transfer(address _recipient, uint256 _value)
//       onlyPayloadSize(2*32)
//       withNoRisk(msg.sender, _recipient, address(this), _value)
//       public returns(bool success) {

//         require(balances[msg.sender] >= _value, "Your balance is not enough");
//         require(_value > 0, "Value needs to be greater than 0");
//         require(indexStatus == IndexStatus.Active, "Index status is not active");

//         balances[msg.sender] -= _value;
//         balances[_recipient] += _value;
//         emit Transfer(msg.sender, _recipient, _value);
//         return true;
//     }

//     function transferFrom(address _from, address _to, uint256 _value)
//       withNoRisk(_from, _to, address(this), _value)
//       public returns(bool success){
//         require(balances[_from] >= _value, "Your balance is not enough");
//         require(allowed[_from][msg.sender] >= _value, "Not enough balance is allowed");
//         require(_value > 0, "Value needs to be greater than 0");
//         require(indexStatus == IndexStatus.Active, "Index status is not active");

//         balances[_to] += _value;
//         balances[_from] -= _value;
//         allowed[_from][msg.sender] -= _value;
//         emit Transfer(_from, _to, _value);
//         return true;
//     }

//     function approve(address _spender, uint256 _value) public returns(bool success) {
//         allowed[msg.sender][_spender] = _value;
//         emit Approval(msg.sender, _spender, _value);
//         return true;
//     }

//     function allowance(address _owner, address _spender) view public returns (uint256) {
//         return allowed[_owner][_spender];
//     }
//     // -------------------------- INVEST --------------------------

//  // Minimal 0.1 ETH
//     function () public
//       withNoRisk(msg.sender, address(this), 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee, msg.value)
//       payable {
//         uint _fee;
//         uint _realBalance;
//         uint _realShare;
//         uint _sharePrice;

//         require(indexStatus == IndexStatus.Active, "Index status is not active");
//         require(msg.value >= 10**15, "The minium to invest required is 0.01 ETH");

//         (_realBalance,_fee) = calculateFee(msg.value);
//         _sharePrice = getPriceInternal(msg.value);
//         pendingOwnerFee += _fee;
//         _realShare = _realBalance / _sharePrice;
//         balances[msg.sender] += _realShare * 10 ** decimals;
//         totalSupply += _realShare * 10 ** decimals;
//         emit Transfer(owner, msg.sender, _realShare * 10 ** decimals);
//         emit BuyIndex(msg.sender, _realShare * 10 ** decimals);
//     }

//     function calculateFee(uint invest) internal view returns(uint _realBalance,uint _managementFee){
//         _managementFee = invest / 100 * indexManagmentFee;
//         _realBalance = invest - _managementFee;
//     }

//     function withdrawFee() public onlyOwner {
//        // TODO: Does index need withdrawCycle?
//         require(pendingOwnerFee > 0);
//         owner.transfer(pendingOwnerFee);
//         withdrawedFee += pendingOwnerFee;
//         pendingOwnerFee = 0;
//     }

//     function getPriceInternal(uint _vaule) internal view returns(uint _price) {

//         uint _totalVaule = 0;
//         uint _expectedRate;
//         if(totalSupply == 0){return 10**18;} // 1 Eth

//         ERC20 erc20Token;

//         for (uint i = 0; i < indexTokenAddresses.length; i++) {
//             erc20Token = ERC20(indexTokenAddresses[i]);
//             uint _balance = erc20Token.balanceOf(address(this));
//             uint _decimal = erc20Token.decimals();
//             if(_balance == 0){continue;}
//             (_expectedRate, ) = priceProvider.getRates(indexTokenAddresses[i], 10**_decimal);
//             if(_expectedRate == 0){continue;}
//             _totalVaule += (_balance * 10**18) / _expectedRate;
//         }

//         if (_totalVaule == 0){return 10**18;} // 1 Eth

//         return ((_totalVaule + address(this).balance - pendingOwnerFee - _vaule) * 10 ** decimals) / totalSupply;
//     }

//     function getPrice() public view returns(uint _price){
//         _price = getPriceInternal(0);
//     }

//     // -------------------------- PROVIDER --------------------------
//     function setPermissionProvider(address _permissionAddress) public onlyOwner {
//         permissionProvider = PermissionProviderInterface(_permissionAddress);
//     }

//     function setPriceProvider(address _priceAddress) public onlyOwner {
//         priceProvider = PriceProviderInterface(_priceAddress);
//     }

//     function setRiskProvider(address _riskProvider) public onlyOwner {
//         riskProvider = RiskManagementProviderInterface(_riskProvider);
//     }

//     function setCore(address _coreAddress) public onlyOwner {
//         core = CoreInterface(_coreAddress);
//     }

//     /**
//     Start Rebalance Functions
//     */
//     function rebalancePrepareSellAndBuy() private returns (bool success){
//         if(rebalanceStatus == RebalanceStatus.INITIATED){
//             uint totalIndexValue = getTotalIndexValue();
//             uint i;
//             for(i = 0; i < indexTokenAddresses.length; i++) {
//                 // Get the amount of tokens expected for 1 ETH
//                 uint ETHTokenPrice = getPrice(ETH_TOKEN, indexTokenAddresses[i], 10**18);
//                 if(ETHTokenPrice == 0){
//                     emit LogString("Error", "Price provider doesn't support this tokenIndex: ".toSlice().concat(Converter.bytes32ToString(bytes32(i)).toSlice()));
//                 }
//                 uint currentTokenBalance = ERC20(indexTokenAddresses[i]).balanceOf(address(this)); //
//                 uint shouldHaveAmountOfTokensInETH = (totalIndexValue * indexTokenWeights[i]) / 100;
//                 uint shouldHaveAmountOfTokens = (shouldHaveAmountOfTokensInETH * ETHTokenPrice) / 10**18;

//                 // minus delta
//                 if (shouldHaveAmountOfTokens < (currentTokenBalance - (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
//                     rebalanceTokensToSell.push(RebalanceToken({
//                         tokenAddress: indexTokenAddresses[i],
//                         tokenWeight: indexTokenWeights[i],
//                         amount: currentTokenBalance - shouldHaveAmountOfTokens
//                     }));
//                 // minus delta
//                 } else if (shouldHaveAmountOfTokens > (currentTokenBalance + (currentTokenBalance * rebalanceDeltaPercentage / PERCENTAGE_DENOMINATOR))){
//                     rebalanceTokensToBuy.push(RebalanceToken({
//                         tokenAddress: indexTokenAddresses[i],
//                         tokenWeight: indexTokenWeights[i],
//                         // Convert token balance to ETH price (because we need to send ETH), taking into account the decimals of the token
//                         amount: ((shouldHaveAmountOfTokensInETH - currentTokenBalance) * (10**ERC20(indexTokenAddresses[i]).decimals())) / ETHTokenPrice
//                     }));
//                 }
//             //TODO Does this run out of gas for 100 tokens?
//             }
//             rebalanceStatus = RebalanceStatus.READY_TO_TRADE;
//         }
//         return true;
//     }

//     function reimburseWithResult(bool _result) public returns (bool result){
//         result = _result;
//         reimburse();
//     }

//     function rebalance() public returns (bool success){
//         startGasCalculation();
//         // solium-disable-next-line security/no-block-members
//         require(lastRebalance + rebalanceInterval <= now, "Time is not here yet");
//         if(rebalanceStatus == RebalanceStatus.INACTIVE){
//             ethValueRebalanceStart = address(this).balance;
//             delete rebalanceTokensToSell;
//             delete rebalanceTokensToBuy;
//             rebalanceStatus = RebalanceStatus.INITIATED;
//         }
//         uint i;
//         uint currentProgress = rebalancingTokenProgress;
//         require(rebalancePrepareSellAndBuy(), "Prepare sell and buy failed");

//         if(rebalanceStatus == RebalanceStatus.READY_TO_TRADE || rebalanceStatus == RebalanceStatus.SELLING_IN_PROGRESS){
//             rebalanceStatus = rebalanceTokensToSell.length > 0 ? RebalanceStatus.SELLING_IN_PROGRESS : RebalanceStatus.SELLING_COMPLETE;

//             // First sell tokens
//             for(i = currentProgress; i < rebalanceTokensToSell.length; i++){
//                 if(i > currentProgress + tokenStep){
//                     // Safety measure for gas
//                     // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
//                     return reimburseWithResult(false);
//                 }
//                 // TODO approve token transfers (depending on exchange implementation)
//                 require(exchange(rebalanceTokensToSell[i].tokenAddress,ETH_TOKEN,rebalanceTokensToSell[i].amount), "Exchange sale failed");
//                 rebalancingTokenProgress++;
//                 if(i == rebalanceTokensToSell.length - 1){
//                     rebalanceStatus = RebalanceStatus.SELLING_COMPLETE;
//                 }
//             }
//         }


//         if(rebalanceStatus == RebalanceStatus.SELLING_COMPLETE){
//             rebalanceSoldTokensETHReceived = address(this).balance - ethValueRebalanceStart;
//             rebalanceStatus = rebalanceTokensToBuy.length > 0 && rebalanceSoldTokensETHReceived > 0 ? RebalanceStatus.BUYING_IN_PROGRESS : RebalanceStatus.BUYING_COMPLETE;
//         }

//         // Then buy tokens
//         if(rebalanceStatus == RebalanceStatus.BUYING_IN_PROGRESS){
//             uint sellTxs = rebalancingTokenProgress - currentProgress;
//             rebalancingTokenProgress = 0;
//             uint assumedAmountOfEthToBuy;
//             uint differencePercentage;
//             bool surplus;

//             // Get the total amount of ETH that we are supposed to buy
//             for(i = 0; i < rebalanceTokensToBuy.length; i++){
//                 assumedAmountOfEthToBuy += rebalanceTokensToBuy[i].amount;
//             }

//             // Based on the actual amount of received ETH for sold tokens, calculate the difference percentage
//             // So this can be used to modify the ETH used, so we don't have an ETH shortage or leftovers at the last token buy
//             if(assumedAmountOfEthToBuy > rebalanceSoldTokensETHReceived){
//                 differencePercentage = ((assumedAmountOfEthToBuy - rebalanceSoldTokensETHReceived) * PERCENTAGE_DENOMINATOR) / assumedAmountOfEthToBuy;
//             } else if (assumedAmountOfEthToBuy < rebalanceSoldTokensETHReceived){
//                 surplus = true;
//                 differencePercentage = ((rebalanceSoldTokensETHReceived - assumedAmountOfEthToBuy) * PERCENTAGE_DENOMINATOR) / rebalanceSoldTokensETHReceived;
//             } else {
//                 differencePercentage = 0;
//             }

//             for(i = rebalancingTokenProgress; i < rebalanceTokensToBuy.length; i++){

//                 if(i + sellTxs > currentProgress + tokenStep){
//                     // Safety measure for gas
//                     // If the loop looped more than the tokenStep amount of times, we return false, and this function should be called again
//                     // Also take into account the number of sellTxs that have happened in the current function call
//                     return reimburseWithResult(false);
//                 }
//                 uint slippage;

//                 if(differencePercentage > 0){
//                     // Calculate the actual amount we should buy, based on the actual ETH received from selling tokens
//                     slippage = (rebalanceTokensToBuy[i].amount * differencePercentage) / PERCENTAGE_DENOMINATOR;
//                 }
//                 if(surplus == true){
//                     require(exchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount + slippage), "Exchange buy failed");
//                 } else {
//                     require(exchange(ETH_TOKEN,rebalanceTokensToBuy[i].tokenAddress,rebalanceTokensToBuy[i].amount - slippage), "Exchange buy failed");
//                 }
//                 rebalancingTokenProgress++;
//                 if(i == rebalanceTokensToBuy.length - 1){
//                     rebalanceStatus = RebalanceStatus.BUYING_COMPLETE;
//                 }
//             }

//         }
//         if(rebalanceStatus == RebalanceStatus.BUYING_COMPLETE){
//             // Yay, done! Reset everything, ready for the next time
//             // solium-disable-next-line security/no-block-members
//             lastRebalance = now;
//             rebalanceStatus = RebalanceStatus.INACTIVE;
//             rebalancingTokenProgress = 0;
//             return reimburseWithResult(true);
//         }
//         return reimburseWithResult(false);
//     }

//     // Reset function, in case there is any issue.
//     // Can not be executed once the actual trading has started for safety.
//     function resetRebalance() public onlyOwner returns(bool) {
//         require(
//             rebalanceStatus == RebalanceStatus.INACTIVE || rebalanceStatus == RebalanceStatus.INITIATED || rebalanceStatus == RebalanceStatus.READY_TO_TRADE);
//         rebalanceStatus = RebalanceStatus.INACTIVE;
//         rebalancingTokenProgress = 0;
//         return true;
//     }

//     // We should have this function, so that if there is an issue with a token (e.g. costing a lot of gas)
//     // we can reduce the limit to narrow down the problematic token, or just temporary limit
//     function updateTokensPerRebalance(uint tokenAmount) public onlyOwner returns(bool){
//         require(tokenAmount > 0);
//         tokenStep = tokenAmount;
//         return true;
//     }

//     function getPrice(address _src, address _dest, uint _amount) private view returns (uint _expectedRate) {
//         if(_src == ETH_TOKEN){
//             // TODO: price provider get both ways
//             (_expectedRate, ) = priceProvider.getRates(_dest, _amount);
//         } else {
//             (_expectedRate, ) = priceProvider.getSellRates(_src, _amount);
//         }
//     }

//     function exchange(address _src, address _dest, uint _amount) private returns (bool){
//         uint slippage;
//         ERC20[] memory tokensToTrade;
//         uint[] memory tokenAmountsToTrade;
//         uint[] memory slippageArray;
//         if(_src == ETH_TOKEN){
//             (,slippage) = priceProvider.getRates(_dest, _amount);
//             tokensToTrade[0] = ERC20(_dest);
//             tokenAmountsToTrade[0] = _amount;
//             slippageArray[0] = slippage;
//             return core.buyToken.value(_amount)("",tokensToTrade,tokenAmountsToTrade,slippageArray,address(this));
//         } else {
//             (,slippage) = priceProvider.getRates(_src, _amount);
//             tokensToTrade[0] = ERC20(_src);
//             tokenAmountsToTrade[0] = _amount;
//             slippageArray[0] = slippage;
//             ERC20(_src).approve(address(core),2**255);
//             return core.sellToken("",tokensToTrade,tokenAmountsToTrade,slippageArray,address(this));
//         }
//     }

//     function getTotalIndexValue() public view returns (uint totalValue){
//         for(uint i = 0; i < indexTokenAddresses.length; i++){
//             totalValue += ERC20(indexTokenAddresses[i]).balanceOf(address(this))*
//             getPrice(indexTokenAddresses[i], ETH_TOKEN, 10**ERC20(indexTokenAddresses[i]).decimals()) / 10**18;
//         }
//     }

//     /**
//     End Rebalance Functions
//     */

// 	  // Event which is triggered to log all transfers to this contract's event log
//     event Transfer(
//       address indexed _from,
//       address indexed _to,
//       uint256 _value
//     );

//   	// Event which is triggered whenever an owner approves a new allowance for a spender.
//     event Approval(
//       address indexed _owner,
//       address indexed _spender,
//       uint256 _value
//     );


//     event BuyIndex(
//         address indexed _spender,
//         uint256 _value
//     );
// }
