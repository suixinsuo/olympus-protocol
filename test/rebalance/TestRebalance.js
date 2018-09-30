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

contract.only("MockRebalanceIndex", accounts => {
  let tokens;
  let exchangeProvider;
  let rebalanceProvider;
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
        tokens = (await _mockKyberNetwork.supportedTokens()).slice(0, 2);

        assert.ok(_mockKyberNetwork, "MockKyberNetwork contract is not deployed.");
        assert.ok(_rebalanceProvider, "RebalanceProvider contract is not deployed.");
        assert.ok(_exchangeProvider, "ExchangeProvider contract is not deployed.");
        assert.ok(_exchangeAdapterManager, "ExchangeAdapterManager contract is not deployed.");
        assert.ok(_kyberNetworkAdapter, "KyberNetworkExchange contract is not deployed.");
        assert.ok(_mockToken, "MockToken contract is not deployed.");

        exchangeProvider = _exchangeProvider;
        rebalanceProvider = _rebalanceProvider;
        mockKyberNetwork = _mockKyberNetwork;

        _mockRebalanceIndex = await MockRebalanceIndex.new(
          tokens,
          [50, 50],
          RebalanceProvider.address,
          ExchangeProvider.address
        );

        assert.ok(_mockRebalanceIndex, "MockRebalanceIndex contract is not deployed.");
        mockRebalanceIndex = _mockRebalanceIndex;

        await _rebalanceProvider.setMotAddress(_mockToken.address);
        await _exchangeProvider.setMotAddress(_mockToken.address);
      }
    );
  });

  it("initialization", async () => {
    await mockRebalanceIndex.initialize();

    const srcAmountETH = 1;

    const result = await rebalanceProvider.needsRebalance.call(0.001 * 10 ** 18, mockRebalanceIndex.address);
    assert.equal(result, false, "No need to rebalance initially");
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    await mockRebalanceIndex.buyToken(tokens[0], amount, rate, 0x0, {
      value: web3.toWei(srcAmountETH)
    });
    const afterBalance = await erc20Token.balanceOf(_mockRebalanceIndex.address);
    erc20Token.transfer(mockRebalanceIndex.address, afterBalance);
  });

  it("MockRebalanceIndex should not use cached price if timeout is exceeded.", async () => {
    // Set timeout to zero, so cached prices will never work
    await rebalanceProvider.updateCachedPriceTimeout(0);

    // Simulate a broken exchange/token
    await mockKyberNetwork.toggleSimulatePriceZero(true);
    const erc20Token1 = await ERC20Extended.at(tokens[0]);
    const erc20Token2 = await ERC20Extended.at(tokens[1]);
    const beforeBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const beforeBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    await calc.assertReverts(async () => await mockRebalanceIndex.rebalance(), "Rebalance should revert");

    // Get the balance of the tokens
    const afterBalance1 = (await erc20Token1.balanceOf(mockRebalanceIndex.address)).toNumber();
    const afterBalance2 = (await erc20Token2.balanceOf(mockRebalanceIndex.address)).toNumber();
    assert.equal(afterBalance1, beforeBalance1, "No tokens have been sold");
    assert.equal(afterBalance2, beforeBalance2, "No tokens have been sold");

    // Disable the broken exchange simulation, enable next tests to get the prices again.
    await mockKyberNetwork.toggleSimulatePriceZero(false);
    // Update the cache timeout back to the default value (6 hours)
    await rebalanceProvider.updateCachedPriceTimeout(3600 * 6);
  });

  it("Rebalance Provider shouldRebalance should return true.", async () => {
    const result = await rebalanceProvider.needsRebalance.call(0, mockRebalanceIndex.address);
    assert.ok(result);
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
