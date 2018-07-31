const MockKyberNetwork = artifacts.require("exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("exchanges/KyberNetworkAdapter");
const ERC20Extended = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
const ExchangeProvider = artifacts.require("ExchangeProvider");
const MockToken = artifacts.require("MockToken");
const MockExchangeFund = artifacts.require("MockExchangeFund");

const tokensLength = 2;
const ethToken = "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const expectedRate = web3.toBigNumber("1000" + "000000000000000000");
const expectedRateToSell = web3.toBigNumber("1000000000000000");
const BigNumber = web3.BigNumber;

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, "");
}

const Promise = require("bluebird");

const checkPercentageDifference = (value1, value2, percentage) => {
  return value1 > value2
    ? value1 - (value1 * percentage) / 100 < value2
    : value1 + (value1 * percentage) / 100 > value2;
};
contract("ExchangeProvider", accounts => {
  let tokens;
  let mockFund;
  let exchangeProvider;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      MockKyberNetwork.deployed(),
      KyberNetworkAdapter.deployed(),
      ExchangeAdapterManager.deployed(),
      MockToken.deployed(),
      ExchangeProvider.deployed()
    ])
      .spread(
        async (_mockKyberNetwork, _kyberNetworkAdapter, _exchangeAdapterManager, _mockToken, _exchangeProvider) => {
          assert.ok(_mockKyberNetwork, "MockKyberNetwork contract is not deployed.");
          assert.ok(_kyberNetworkAdapter, "KyberNetworkExchange contract is not deployed.");
          assert.ok(_exchangeAdapterManager, "ExchangeAdapterManager contract is not deployed.");
          assert.ok(_mockToken, "MockToken contract is not deployed.");
          assert.ok(_exchangeProvider, "ExchangeProvider contract is not deployed.");
          await _exchangeProvider.setMotAddress(_mockToken.address);
          tokens = await _mockKyberNetwork.supportedTokens();
          return (exchangeProvider = _exchangeProvider);
        }
      )
      .then(async provider => {
        mockFund = await MockExchangeFund.new(provider.address);
        return await mockFund.initialize();
      });
  });

  it("OlympusExchange should be able to buy single token.", async () => {
    const srcAmountETH = 1;

    const erc20Token = await ERC20Extended.at(tokens[0]);
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    const beforeBalance = await erc20Token.balanceOf(deposit);

    await mockFund.buyToken(tokens[0], amount, rate, deposit, "", 0x0, {
      value: web3.toWei(srcAmountETH)
    });

    const afterBalance = await erc20Token.balanceOf(deposit);
    assert.equal(new BigNumber(beforeBalance).plus(expectedRate.mul(srcAmountETH)).toNumber(), afterBalance.toNumber());
  });

  it("OlympusExchange should be able to buy multiple tokens.", async () => {
    const srcAmountETH = 1;
    const totalSrcAmountETH = srcAmountETH * tokens.length;

    const amounts = [];
    const rates = [];
    const beforeBalance = [];

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      beforeBalance.push(await erc20Token.balanceOf(deposit));
      amounts.push(web3.toWei(srcAmountETH));
      rates.push(expectedRate);
    }
    await mockFund.buyTokens(tokens, amounts, rates, deposit, "", 0x0, {
      value: web3.toWei(totalSrcAmountETH)
    });

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const afterBalance = await erc20Token.balanceOf(deposit);
      assert.equal(
        new BigNumber(beforeBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(),
        afterBalance.toNumber()
      );
    }
  });

  it("OlympusExchange should be able to sell a single token.", async () => {
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const amount = (await erc20Token.balanceOf(deposit)) / 2; // Keep some for multiple sell tokens
    const rate = expectedRateToSell;

    const beforeBalance = await web3.eth.getBalance(mockFund.address);
    await erc20Token.transfer(mockFund.address, amount);
    await mockFund.sellToken(tokens[0], amount, rate, "", 0x0);
    const expectedAmount = (amount * expectedRateToSell.toNumber()) / 10 ** 18; // ETH decimals
    assert.ok(
      checkPercentageDifference(
        new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber(),
        expectedAmount,
        1
      )
    );
  });

  it("OlympusExchange should be able to sell multiple tokens.", async () => {
    const amounts = [];
    const rates = [];
    const expectedAmounts = [];

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const actualBalance = await erc20Token.balanceOf(deposit);
      amounts.push(actualBalance);
      rates.push(expectedRateToSell);
      expectedAmounts.push((actualBalance * expectedRateToSell.toNumber()) / 10 ** 18); // ETH decimals

      // send all it has to the mockFund so it can sell below.
      await erc20Token.transfer(mockFund.address, actualBalance);
    }

    const beforeBalance = await web3.eth.getBalance(mockFund.address);
    await mockFund.sellTokens(tokens, amounts, rates, "", 0x0);
    assert.ok(
      checkPercentageDifference(
        new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber(),
        expectedAmounts.reduce((a, b) => a + b, 0),
        1
      )
    );
    assert.ok(new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber() > 0);
  });

  it("Should be able to check availability for a token", async () => {
    const result = await mockFund.supportsTradingPair.call(ethToken, tokens[0], "");
    // Ignore this test for now, mock kyber network now always returns a rate
    // const nonExistent = await mockFund.supportsTradingPair.call(ethToken, 0x4532453245, "");
    assert.ok(result);
    // assert.ok(!nonExistent);
  });
});
