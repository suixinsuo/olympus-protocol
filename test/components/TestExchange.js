const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter");
const SimpleERC20Token = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeAdapterManager = artifacts.require("../contracts/components/exchange/ExchangeAdapterManager");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");

const tokensLength = 2;
const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const expectedRateToSell = web3.toBigNumber('1000000000000000');
const BigNumber = web3.BigNumber;

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, '');
}

const Promise = require('bluebird');

const checkPercentageDifference = (value1, value2, percentage) => {
  return value1 > value2 ? (value1 - (value1 * percentage / 100)) < value2 : (value1 + (value1 * percentage / 100)) > value2;
}
contract('ExchangeProvider', (accounts) => {
  let tokens;
  let exchangeProvider;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      MockKyberNetwork.deployed(),
      KyberNetworkAdapter.deployed(),
      ExchangeAdapterManager.deployed(),
      ExchangeProvider.deployed(),
    ]).spread(async (_mockKyberNetwork, _kyberNetworkAdapter, _exchangeAdapterManager, _exchangeProvider) => {
      assert.ok(_mockKyberNetwork, 'MockKyberNetwork contract is not deployed.');
      assert.ok(_kyberNetworkAdapter, 'KyberNetworkExchange contract is not deployed.');
      assert.ok(_exchangeAdapterManager, 'ExchangeAdapterManager contract is not deployed.');
      assert.ok(_exchangeProvider, 'ExchangeProvider contract is not deployed.');
      tokens = await _mockKyberNetwork.supportedTokens();
      exchangeProvider = _exchangeProvider;
    });
  });

  it("OlympusExchange should be able to buy multiple tokens.", async () => {
    const srcAmountETH = 1;

    const erc20Token = await SimpleERC20Token.at(tokens[0]);
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    const beforeBalance = await erc20Token.balanceOf(deposit);

    await exchangeProvider.buyToken(tokens[0], amount, rate, deposit, "", 0x0, { value: web3.toWei(srcAmountETH) });

    const afterBalance = await erc20Token.balanceOf(deposit);
    assert.equal(new BigNumber(beforeBalance).plus(expectedRate.mul(srcAmountETH)).toNumber(), afterBalance.toNumber())
  });

  it("OlympusExchange should be able to buy multiple tokens.", async () => {
    const srcAmountETH = 1;
    const totalSrcAmountETH = srcAmountETH * tokens.length;

    const amounts = [];
    const rates = [];
    const beforeBalance = [];

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await SimpleERC20Token.at(tokens[i]);
      beforeBalance.push(await erc20Token.balanceOf(deposit));
      amounts.push(web3.toWei(srcAmountETH));
      rates.push(expectedRate);
    }
    await exchangeProvider.buyTokens(tokens, amounts, rates, deposit, "", 0x0, { value: web3.toWei(totalSrcAmountETH) });

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await SimpleERC20Token.at(tokens[i]);
      const afterBalance = await erc20Token.balanceOf(deposit);
      assert.equal(new BigNumber(beforeBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(), afterBalance.toNumber())
    }
  });

  it("OlympusExchange should be able to sell a single token.", async () => {
    const erc20Token = await SimpleERC20Token.at(tokens[0]);
    const amount = (await erc20Token.balanceOf(deposit) / 2); // Keep some for multiple sell tokens
    const rate = expectedRateToSell;
    await erc20Token.approve(exchangeProvider.address, amount);

    const beforeBalance = await web3.eth.getBalance(deposit);
    await exchangeProvider.sellToken(tokens[0], amount, rate, deposit, "", 0x0);
    const expectedAmount = amount * expectedRateToSell.toNumber() / 10 ** 18; // ETH decimals
    assert.ok(
      checkPercentageDifference(
        new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber(),
        expectedAmount,
        1));
  });

  it("OlympusExchange should be able to sell multiple tokens.", async () => {
    const amounts = [];
    const rates = [];
    const expectedAmounts = [];

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await SimpleERC20Token.at(tokens[i]);
      const actualBalance = await erc20Token.balanceOf(deposit);
      amounts.push(actualBalance);
      rates.push(expectedRateToSell);
      expectedAmounts.push(actualBalance * expectedRateToSell.toNumber() / 10 ** 18); // ETH decimals

      await erc20Token.approve(exchangeProvider.address, actualBalance);
    }

    const beforeBalance = await web3.eth.getBalance(deposit);
    await exchangeProvider.sellTokens(tokens, amounts, rates, deposit, "", 0x0);
    assert.ok(checkPercentageDifference(
      new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber(),
      expectedAmounts.reduce((a, b) => a + b, 0),
      1
    ))
    assert.ok(new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber() > 0);
  });

  it('Should be able to check availability for a token', async () => {
    const result = await exchangeProvider.supportsTradingPair.call(ethToken, tokens[0], "");
    const nonExistent = await exchangeProvider.supportsTradingPair.call(ethToken, 0x4532453245, "");
    assert.ok(result);
    assert.ok(!nonExistent);
  });
});

999907855000000000
1000000000000000
1000000000000000000
