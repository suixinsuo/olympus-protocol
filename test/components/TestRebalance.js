const SimpleERC20Token = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const ExchangeAdapterManager = artifacts.require("../contracts/components/exchange/ExchangeAdapterManager");
const RebalanceProvider = artifacts.require("../contracts/components/rebalance/RebalanceProvider");
const MockRebalanceIndex = artifacts.require("../contracts/components/mocks/MockRebalanceIndex.sol");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter");


const tokensLength = 2;
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const BigNumber = web3.BigNumber;

const Promise = require('bluebird');

contract('MockRebalanceIndex', (accounts) => {
  let tokens;
  let exchangeProvider;
  let rebalanceProvider;
  let mockRebalanceIndex;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      ExchangeProvider.deployed(),
      RebalanceProvider.deployed(),
      MockRebalanceIndex.deployed(),
      MockKyberNetwork.deployed(),
      ExchangeAdapterManager.deployed(),
      KyberNetworkAdapter.deployed(),
    ]).spread(async (_exchangeProvider, _rebalanceProvider, _mockRebalanceIndex, _mockKyberNetwork, _exchangeAdapterManager, _kyberNetworkAdapter) => {
      assert.ok(_mockKyberNetwork, 'MockKyberNetwork contract is not deployed.');
      assert.ok(_mockRebalanceIndex, 'MockRebalanceIndex contract is not deployed.');
      assert.ok(_rebalanceProvider, 'RebalanceProvider contract is not deployed.');
      assert.ok(_exchangeProvider, 'ExchangeProvider contract is not deployed.');
      assert.ok(_exchangeAdapterManager, 'ExchangeAdapterManager contract is not deployed.');
      assert.ok(_kyberNetworkAdapter, 'KyberNetworkExchange contract is not deployed.');

      tokens = await _mockKyberNetwork.supportedTokens();
      exchangeProvider = _exchangeProvider;
      rebalanceProvider = _rebalanceProvider;
      mockRebalanceIndex = _mockRebalanceIndex;

      const srcAmountETH = 1;

      const erc20Token = await SimpleERC20Token.at(tokens[0]);
      const amount = web3.toWei(srcAmountETH);
      const rate = expectedRate;
      const beforeBalance = await erc20Token.balanceOf(deposit);
      console.log('beforeBalance', beforeBalance);
      await exchangeProvider.buyToken(tokens[0], amount, rate, deposit, "", 0x0, { value: web3.toWei(srcAmountETH) });

      const afterBalance = await erc20Token.balanceOf(deposit);

      console.log('afterBalance', afterBalance);
      erc20Token.transfer(mockRebalanceIndex.address, afterBalance);
    });
  });

  it("MockRebalanceIndex should be able to rebalance tokens.", async () => {
    let result = await mockRebalanceIndex.rebalance.call();
    console.log(result);
    // throw 0;
  });
});
