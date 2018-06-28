const SimpleERC20Token = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const ExchangeAdapterManager = artifacts.require("../contracts/components/exchange/ExchangeAdapterManager");
const RebalanceProvider = artifacts.require("../contracts/components/rebalance/RebalanceProvider");
const MockRebalanceIndex = artifacts.require("../contracts/components/mocks/MockRebalanceIndex.sol");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter");

const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

const Promise = require('bluebird');

contract('MockRebalanceIndex', (accounts) => {
  let tokens;
  let exchangeProvider;
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
      await exchangeProvider.buyToken(tokens[0], amount, rate, deposit, "", 0x0, { value: web3.toWei(srcAmountETH) });
      const afterBalance = await erc20Token.balanceOf(deposit);

      erc20Token.transfer(mockRebalanceIndex.address, afterBalance);
    });
  });

  it("MockRebalanceIndex should be able to rebalance tokens.", async () => {
    const erc20Token1 = await SimpleERC20Token.at(tokens[0]);
    const erc20Token2 = await SimpleERC20Token.at(tokens[1]);
    const beforeBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const beforeBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    await mockRebalanceIndex.rebalance();
    const afterBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const afterBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    // Should have sold exactly half of our tokens
    assert.equal(afterBalance1, beforeBalance1 / 2);
    // Should have received some tokens, rates can vary
    assert.ok(afterBalance2 > beforeBalance2);
  });
});
