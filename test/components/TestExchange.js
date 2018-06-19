const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token");
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

contract('ExchangeProvider', (accounts) => {

  before(async () => {
    return await Promise.all([
      MockKyberNetwork.deployed(),
      KyberNetworkAdapter.deployed(),
      ExchangeAdapterManager.deployed(),
      ExchangeProvider.deployed(),
    ]).spread((mockKyberNetwork, kyberNetworkAdapter, exchangeAdapterManager, exchangeProvider) => {
      assert.ok(mockKyberNetwork, 'MockKyberNetwork contract is not deployed.');
      assert.ok(kyberNetworkAdapter, 'KyberNetworkExchange contract is not deployed.');
      assert.ok(exchangeAdapterManager, 'ExchangeAdapterManager contract is not deployed.');
      assert.ok(exchangeProvider, 'ExchangeProvider contract is not deployed.');
    });
  });

  it("OlympusExchange should be able to buy multiple tokens.", async () => {
    let mockKyberNetwork = await MockKyberNetwork.deployed();
    let tokens = await mockKyberNetwork.supportedTokens();
    let exchangeProvider = await ExchangeProvider.deployed();

    let srcAmountETH = 1;

    let erc20Token = await SimpleERC20Token.at(tokens[0]);
    let deposit = accounts[0];
    let amount = web3.toWei(srcAmountETH);
    let rate = expectedRate;
    let actualBalance = await erc20Token.balanceOf(deposit);

    result = await exchangeProvider.buyToken(tokens[0], amount, rate, deposit, "", 0x0, { value: web3.toWei(srcAmountETH) });

    let tokenBalance = await erc20Token.balanceOf(deposit);
    assert.equal(new BigNumber(actualBalance).plus(expectedRate.mul(srcAmountETH)).toNumber(), tokenBalance.toNumber())
  });

  it("OlympusExchange should be able to buy multiple tokens.", async () => {
    let mockKyberNetwork = await MockKyberNetwork.deployed();
    let tokens = await mockKyberNetwork.supportedTokens();
    let exchangeProvider = await ExchangeProvider.deployed();

    let srcAmountETH = 1;
    let totalSrcAmountETH = srcAmountETH * tokens.length;

    let deposit = accounts[0];
    let amounts = [];
    let rates = [];
    let actualBalance = [];

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      actualBalance.push(await erc20Token.balanceOf(deposit));
      amounts.push(web3.toWei(srcAmountETH));
      rates.push(expectedRate);
    }
    result = await exchangeProvider.buyTokens(tokens, amounts, rates, deposit, "", 0x0, { value: web3.toWei(totalSrcAmountETH) });

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let tokenBalance = await erc20Token.balanceOf(deposit);
      assert.equal(new BigNumber(actualBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(), tokenBalance.toNumber())
    }
  });

  it("OlympusExchange should be able to sell a single token.", async () => {
    let mockKyberNetwork = await MockKyberNetwork.deployed();
    let tokens = await mockKyberNetwork.supportedTokens();
    let exchangeProvider = await ExchangeProvider.deployed();

    let deposit = accounts[0];

    let erc20Token = await SimpleERC20Token.at(tokens[0]);
    let amount = await erc20Token.balanceOf(deposit);
    let rate = expectedRateToSell;
    await erc20Token.approve(exchangeProvider.address, amount);

    let beforeBalance = await web3.eth.getBalance(deposit);
    result = await exchangeProvider.sellToken(tokens[0], amount, rate, deposit, "", 0x0);

    assert.ok(new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber() > 0);
  });

  it("OlympusExchange should be able to sell multiple tokens.", async () => {
    let mockKyberNetwork = await MockKyberNetwork.deployed();
    let tokens = await mockKyberNetwork.supportedTokens();
    let exchangeProvider = await ExchangeProvider.deployed();

    let deposit = accounts[0];
    let amounts = [];
    let rates = [];
    let beforeBalance = 0;

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualBalance = await erc20Token.balanceOf(deposit);
      amounts.push(actualBalance);
      rates.push(expectedRateToSell);
      await erc20Token.transfer(exchangeProvider.address, actualBalance);
    }

    beforeBalance = await web3.eth.getBalance(deposit);
    result = await exchangeProvider.sellTokens(tokens, amounts, rates, deposit, "", 0x0);

    assert.ok(new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber() > 0);
  });

  it('Should be able to check availability for a token', async () => {
    let mockKyberNetwork = await MockKyberNetwork.deployed();
    let tokens = await mockKyberNetwork.supportedTokens();
    let exchangeProvider = await ExchangeProvider.deployed();

    let result = await exchangeProvider.supportsTradingPair.call(ethToken, tokens[0], "");
    let nonExistent = await exchangeProvider.supportsTradingPair.call(ethToken, 0x4532453245, "");
    assert.ok(result);
    assert.ok(!nonExistent)
  });
});

