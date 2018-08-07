const ERC20Extended = artifacts.require("ERC20Extended");
const ExchangeProvider = artifacts.require("ExchangeProvider");
const ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
const RebalanceProvider = artifacts.require("RebalanceProvider");
const MockRebalanceIndex = artifacts.require("MockRebalanceIndex");
const MockKyberNetwork = artifacts.require("MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("KyberNetworkAdapter");
const MockToken = artifacts.require("MockToken");

const expectedRate = web3.toBigNumber("1000" + "000000000000000000");
const calc = require("../utils/calc");

const Promise = require("bluebird");

contract("MockRebalanceIndex", accounts => {
  let tokens;
  let exchangeProvider;
  let mockRebalanceIndex;
  let mockKyberNetwork;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      ExchangeProvider.deployed(),
      MockKyberNetwork.deployed(),
      ExchangeAdapterManager.deployed(),
      KyberNetworkAdapter.deployed(),
      MockToken.deployed(),
      RebalanceProvider.deployed()
    ]).spread(
      async (
        _exchangeProvider,
        _mockKyberNetwork,
        _exchangeAdapterManager,
        _kyberNetworkAdapter,
        _mockToken,
        _rebalanceProvider
      ) => {
        tokens = await _mockKyberNetwork.supportedTokens();

        _mockRebalanceIndex = await MockRebalanceIndex.new(
          tokens,
          [50, 50],
          RebalanceProvider.address,
          ExchangeProvider.address
        );

        assert.ok(_mockKyberNetwork, "MockKyberNetwork contract is not deployed.");
        assert.ok(_mockRebalanceIndex, "MockRebalanceIndex contract is not deployed.");
        assert.ok(_rebalanceProvider, "RebalanceProvider contract is not deployed.");
        assert.ok(_exchangeProvider, "ExchangeProvider contract is not deployed.");
        assert.ok(_exchangeAdapterManager, "ExchangeAdapterManager contract is not deployed.");
        assert.ok(_kyberNetworkAdapter, "KyberNetworkExchange contract is not deployed.");
        assert.ok(_mockToken, "MockToken contract is not deployed.");

        exchangeProvider = _exchangeProvider;
        rebalanceProvider = _rebalanceProvider;
        mockKyberNetwork = _mockKyberNetwork;
        mockRebalanceIndex = _mockRebalanceIndex;
        const srcAmountETH = 1;

        await _rebalanceProvider.setMotAddress(_mockToken.address);
        await _exchangeProvider.setMotAddress(_mockToken.address);

        const erc20Token = await ERC20Extended.at(tokens[0]);
        const amount = web3.toWei(srcAmountETH);
        const rate = expectedRate;
        await _mockRebalanceIndex.buyToken(tokens[0], amount, rate, 0x0, {
          value: web3.toWei(srcAmountETH)
        });
        const afterBalance = await erc20Token.balanceOf(_mockRebalanceIndex.address);

        erc20Token.transfer(mockRebalanceIndex.address, afterBalance);
        await mockRebalanceIndex.initialize();
      }
    );
  });

  it("MockRebalanceIndex should not use cached price if timeout is exceeded.", async () => {
    await rebalanceProvider.updateCachedPriceTimeout(0);
    await mockKyberNetwork.toggleSimulatePriceZero(true);
    const erc20Token1 = await ERC20Extended.at(tokens[0]);
    const erc20Token2 = await ERC20Extended.at(tokens[1]);
    const beforeBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const beforeBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    try {
      await mockRebalanceIndex.rebalance();
      assert.ok(false);
    } catch (e) {
      assert.ok(true);
    }
    const afterBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const afterBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    // Should have sold exactly half of our tokens
    assert.equal(afterBalance1, beforeBalance1);
    // Should have received some tokens, rates can vary
    assert.equal(afterBalance2, beforeBalance2);
    await mockKyberNetwork.toggleSimulatePriceZero(false);
    await rebalanceProvider.updateCachedPriceTimeout(3600 * 6);
  });

  it("MockRebalanceIndex should be able to rebalance tokens.", async () => {
    const erc20Token1 = await ERC20Extended.at(tokens[0]);
    const erc20Token2 = await ERC20Extended.at(tokens[1]);
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
