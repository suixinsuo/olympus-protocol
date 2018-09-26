const MockKyberNetwork = artifacts.require("exchanges/MockKyberNetwork");
const KyberNetworkAdapter = artifacts.require("exchanges/KyberNetworkAdapter");
const MockBrokenTokenKyberNetworkAdapter = artifacts.require("exchanges/MockBrokenTokenKyberNetworkAdapter");
const ERC20Extended = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
const MockDDEXAdapter = artifacts.require("MockDDEXAdapter");
const ExchangeProvider = artifacts.require("ExchangeProvider");
const MockToken = artifacts.require("MockToken");
const MockExchangeFund = artifacts.require("MockExchangeFund");

const tokensLength = 2;
const ethToken = "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const expectedRate = web3.toBigNumber("1000" + "000000000000000000");
const expectedRateToSell = web3.toBigNumber("1000000000000000");
const BigNumber = web3.BigNumber;
const calc = require("../utils/calc");
const brokenTokenList = ["0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42000", "0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42001"]

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, "");
}

const getAmountWithRates = async () => {

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
  let mockKyberNetwork;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      MockKyberNetwork.deployed(),
      MockBrokenTokenKyberNetworkAdapter.deployed(),
      KyberNetworkAdapter.deployed(),
      ExchangeAdapterManager.deployed(),
      MockToken.deployed(),
      ExchangeProvider.deployed()
    ])
      .spread(
        async (_mockKyberNetwork, _mockBrokenTokenKyberNetworkAdapter, _kyberNetworkAdapter, _exchangeAdapterManager, _mockToken, _exchangeProvider) => {
          assert.ok(_mockKyberNetwork, "MockKyberNetwork contract is not deployed.");
          assert.ok(_mockBrokenTokenKyberNetworkAdapter, "MockBrokenTokenKyberNetworkAdapter contract is not deployed.");
          assert.ok(_kyberNetworkAdapter, "KyberNetworkExchange contract is not deployed.");
          assert.ok(_exchangeAdapterManager, "ExchangeAdapterManager contract is not deployed.");
          assert.ok(_mockToken, "MockToken contract is not deployed.");
          assert.ok(_exchangeProvider, "ExchangeProvider contract is not deployed.");
          await _exchangeProvider.setMotAddress(_mockToken.address);
          tokens = (await _mockKyberNetwork.supportedTokens()).slice(0,2);
          mockKyberNetwork = _mockKyberNetwork;
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

    await mockFund.buyToken(tokens[0], amount, rate, deposit, 0x0, {
      value: web3.toWei(srcAmountETH)
    });

    const afterBalance = await erc20Token.balanceOf(deposit);
    assert.equal(new BigNumber(beforeBalance).plus(expectedRate.mul(srcAmountETH)).toNumber(), afterBalance.toNumber(),
      "Did receive the right amount of tokens");
  });

  it("OlympusExchange should return the ETH if the single buy trade cannot be executed", async () => {
    const srcAmountETH = 1;
    const initialBalance = web3.eth.getBalance(accounts[0]);

    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;

    await exchangeProvider.buyToken(ethToken, amount, rate, deposit, 0x0, {
      value: web3.toWei(srcAmountETH)
    });

    const endBalance = web3.eth.getBalance(accounts[0]);
    // Still uses some ETH for the gas, as long as the difference is not 0.001 ETH we know it got returned succesfully
    assert.ok(await calc.inRange(endBalance.toNumber(), initialBalance.toNumber(), 10 ** 15),
      "Did return the Ether back after trade failure");
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
    await mockFund.buyTokens(tokens, amounts, rates, deposit, 0x0, {
      value: web3.toWei(totalSrcAmountETH)
    });

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const afterBalance = await erc20Token.balanceOf(deposit);
      assert.equal(
        new BigNumber(beforeBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(),
        afterBalance.toNumber(),
        `Did receive correct amount of token ${tokens[i]}`
      );
    }
  });

  it("OlympusExchange should return the ETH if one of the buy trades in multiple buy cannot be executed.", async () => {
    const srcAmountETH = 1;
    const totalSrcAmountETH = srcAmountETH * tokens.length;
    const beforeETHBalance = await web3.eth.getBalance(deposit);
    const tokenArrayWithIssueToken = [];
    const amounts = [];
    const rates = [];
    const beforeBalance = [];

    for (let i = 0; i < tokens.length; i++) {
      tokenArrayWithIssueToken[i] = tokens[i];
      const erc20Token = await ERC20Extended.at(tokens[i]);
      beforeBalance.push(await erc20Token.balanceOf(deposit));
      amounts.push(web3.toWei(srcAmountETH));
      rates.push(expectedRate);
    }

    tokenArrayWithIssueToken[0] = ethToken;
    await exchangeProvider.buyTokens(tokenArrayWithIssueToken, amounts, rates, deposit, 0x0, {
      from: deposit,
      value: web3.toWei(totalSrcAmountETH)
    });
    const afterETHBalance = await web3.eth.getBalance(deposit);

    // Total amount used is 2 ETH, but we should have still spent 1ETH, for the token that we didn't break
    assert.ok(
      await calc.inRange(afterETHBalance.toNumber(), (beforeETHBalance.toNumber() - srcAmountETH * 10 ** 18), 10 ** 15), `Did use only one ETH`);
    // We start at 1, because the 0 index is our artificially broken token
    for (let i = 1; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const afterBalance = await erc20Token.balanceOf(deposit);
      // Check if the token got succesfully bought
      assert.equal(
        new BigNumber(beforeBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(),
        afterBalance.toNumber(),
        `Did receive the tokens succesfully`
      );
    }
  });

  it("OlympusExchange should be able to sell a single token.", async () => {
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const amount = (await erc20Token.balanceOf(deposit)) / 2; // Keep some for multiple sell tokens
    const rate = expectedRateToSell;

    const beforeBalance = await web3.eth.getBalance(mockFund.address);
    await erc20Token.transfer(mockFund.address, amount);
    await mockFund.sellToken(tokens[0], amount, rate, "");
    const expectedAmount = (amount * expectedRateToSell.toNumber()) / 10 ** 18; // ETH decimals
    assert.ok(
      checkPercentageDifference(
        new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber(),
        expectedAmount,
        1
      ),
      `Did receive ETH for the sale of a token`
    );
  });

  it("OlympusExchange should return the tokens if the single sell trade cannot be executed.", async () => {
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const amount = await erc20Token.balanceOf(deposit);
    const rate = expectedRateToSell;
    const beforeBalance = await web3.eth.getBalance(deposit);
    await erc20Token.approve(exchangeProvider.address, amount);
    await mockKyberNetwork.toggleSimulatePriceZero(true);

    await exchangeProvider.sellToken(tokens[0], amount, rate, deposit, 0x0);
    // Only the gas should be used, we shouldn't have received any ETH
    assert.ok(await calc.inRange(await web3.eth.getBalance(deposit).toNumber(), beforeBalance.toNumber(), 10 ** 15),
      `Did only use gas, haven't received ETH`);
    // Amount of tokens we have shouldn't have changed
    assert.equal(amount.toNumber(), (await erc20Token.balanceOf(deposit)).toNumber(),
      `Did not take any tokens`);
    await mockKyberNetwork.toggleSimulatePriceZero(false);

  });

  it("OlympusExchange should return the tokens if one of the sell trades in multiple sell cannot be executed.", async () => {
    const amounts = [];
    const rates = [];
    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const actualBalance = await erc20Token.balanceOf(deposit);
      amounts.push(actualBalance);
      rates.push(expectedRateToSell);
      await erc20Token.approve(exchangeProvider.address, actualBalance);
    }

    await mockKyberNetwork.toggleSimulatePriceZero(true);

    await exchangeProvider.sellTokens(tokens, amounts, rates, deposit, 0x0);

    for (let i = 0; i < tokens.length; i++) {
      const erc20Token = await ERC20Extended.at(tokens[i]);
      const actualBalance = await erc20Token.balanceOf(deposit);
      // Should still have all the tokens
      assert.equal(actualBalance.toNumber(), amounts[i].toNumber(), `Should still have all the tokens`);
    }
    await mockKyberNetwork.toggleSimulatePriceZero(false);
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
    await mockFund.sellTokens(tokens, amounts, rates, "");
    assert.ok(
      checkPercentageDifference(
        new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber(),
        expectedAmounts.reduce((a, b) => a + b, 0),
        1
      ),
      `Did receive expected ETH for the sale of a token`
    );
    assert.ok(new BigNumber(await web3.eth.getBalance(mockFund.address)).minus(beforeBalance).toNumber() > 0,
      `Did have more ETH than at the start due to the sale`);
  });

  it("Should be able to check availability for a token", async () => {
    const result = await mockFund.supportsTradingPair.call(ethToken, tokens[0], "");
    assert.ok(result, `Token is available`);
  });

  it("Should be able to get the price also from cache", async () => {
    let result = await exchangeProvider.getPriceOrCacheFallback.call(ethToken, tokens[0], 10 ** 18, 0x0, 0);
    let resultTx = await exchangeProvider.getPriceOrCacheFallback(ethToken, tokens[0], 10 ** 18, 0x0, 0);
    assert.ok(resultTx, `Tx does not revert`);
    assert.equal(result[0].toNumber(), expectedRate.toNumber(), `ExpectedRate is correct`);
    assert.equal(result[1].toNumber(), expectedRate.toNumber(), `SlippageRate is correct`);
    assert.equal(result[2], false, `It's a live price`); // False indicates this is a live price, not from cache

    await mockKyberNetwork.toggleSimulatePriceZero(true);
    result = await exchangeProvider.getPriceOrCacheFallback.call(ethToken, tokens[0], 10 ** 18, 0x0, 1000);
    resultTx = await exchangeProvider.getPriceOrCacheFallback(ethToken, tokens[0], 10 ** 18, 0x0, 1000);

    assert.ok(resultTx, `Tx does not revert`);
    assert.equal(result[0].toNumber(), expectedRate.toNumber(), `ExpectedRate is correct`);
    assert.equal(result[1].toNumber(), expectedRate.toNumber(), `SlippageRate is correct`);
    assert.equal(result[2], true, `It's a cached price`); // True indicates that this price comes from the cache
  });

  it("Should not be able to get the price from cache if it's not recent enough", async () => {
    await calc.waitSeconds(1);

    result = await exchangeProvider.getPriceOrCacheFallback.call(ethToken, tokens[0], 10 ** 18, 0x0, 0);
    resultTx = await exchangeProvider.getPriceOrCacheFallback(ethToken, tokens[0], 10 ** 18, 0x0, 0);

    assert.ok(resultTx, `Tx does not revert`);
    assert.equal(result[0].toNumber(), 0, `ExpectedRate is zero`);
    assert.equal(result[1].toNumber(), 0, `SlippageRate is zero`);
    assert.equal(result[2], false, `ExpectedRate should not come from cache`); // Didn't come from cache, because there is none for the specified maxAge
    await mockKyberNetwork.toggleSimulatePriceZero(false);//reset
  });

  it("Should not be able to get the price from 2rd exchanges", async () => {
    await calc.waitSeconds(1);
    let exchangeprice;
    let exchangeprice2;

    let AdapterManager = await ExchangeAdapterManager.deployed();
    let mockddexadapter = await MockDDEXAdapter.deployed();
    await AdapterManager.addExchange("ddex", mockddexadapter.address);
    let exchangeidtwo = await AdapterManager.exchanges(1);
    exchangeprice = await AdapterManager.getPrice.call(tokens[0], ethToken, web3.toWei(1, "ether"), exchangeidtwo);

    exchangeprice2 = await AdapterManager.getPrice.call(tokens[0], ethToken, web3.toWei(1, "ether"), "");

    assert.equal(exchangeprice[0].toNumber(), 10 ** 14, `MockDDEXRate`);

    assert.equal(exchangeprice2[0].toNumber(), 10 ** 15, `BestRate`);

    await AdapterManager.removeExchangeAdapter(exchangeidtwo);
  });

  it("Should get mock token price from mockBrokenTokenKyber", async () => {
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();
    let motPrice = await mockKyberNetworkAdapter.getPrice(ethToken, MockToken.address, 1000);
    assert.notEqual(motPrice.toString(), '0')
  });
  it("Should set broken token address for mockBrokenTokenKyber", async () => {
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();
    let result = await mockKyberNetworkAdapter.setBrokenTokens(brokenTokenList);
    assert.equal(result.receipt.status, '0x1')
  });
  it("Should get broken token address from mockBrokenTokenKyber", async () => {
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();
    let brokenToken = await mockKyberNetworkAdapter.getBrokenTokens();
    for (let i in brokenTokenList) {
      assert.equal(brokenToken[i].toLowerCase(), brokenTokenList[i].toLowerCase());
    }
  });
  it("Should get 0 from mockBrokenTokenKyber when the token is broken", async () => {
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();
    for (let i in brokenTokenList) {
      let tokenPrice = await mockKyberNetworkAdapter.getPrice(ethToken, brokenTokenList[i], 1000);
      assert.equal(tokenPrice.toString(), '0,0')
    }
  });
  it("Should revert from mockBrokenTokenKyber when the buy broken token", async () => {
    const srcAmountETH = 1;
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();

    for (let i in brokenTokenList) {
      await calc.assertReverts(async () => await mockKyberNetworkAdapter.buyToken(brokenTokenList[i], amount, rate, accounts[0]), "Shall revert");
    }
  });
  it("Should revert from mockBrokenTokenKyber when the sell broken token", async () => {
    const srcAmountETH = 1;
    const amount = web3.toWei(srcAmountETH);
    const rate = 1000*10**18;
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();

    for (let i in brokenTokenList) {
      await calc.assertReverts(async () => await mockKyberNetworkAdapter.sellToken(brokenTokenList[i], amount, rate, accounts[0]), "Shall revert");
    }
  });

  it("Should revert buy brokenToken from token swap", async () => {
    const srcAmountETH = 1;
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    let mockKyberNetworkAdapter = await MockBrokenTokenKyberNetworkAdapter.deployed();

    for (let i in brokenTokenList) {
      await calc.assertReverts(async () => await mockKyberNetworkAdapter.tokenExchange(ethToken, brokenTokenList[i], amount, rate, accounts[0]), "Shall revert");
    }
  });
  it("Should support buy token from token swap", async () => {
    const srcAmountETH = 1;
    const amount = web3.toWei(srcAmountETH);
    const rate = expectedRate;
    let kyberNetworkAdapter = await KyberNetworkAdapter.deployed();
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const beforeBalance = await erc20Token.balanceOf(deposit);

    await kyberNetworkAdapter.tokenExchange(ethToken,tokens[0],amount,rate,deposit,{value: web3.toWei(srcAmountETH)});
    const afterBalance = await erc20Token.balanceOf(deposit);
    assert.equal((afterBalance - beforeBalance), rate , `BestRate`);
  });
  it("Should support token to stoken swap", async () => {
    let kyberNetworkAdapter = await KyberNetworkAdapter.deployed();
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const erc20Token2 = await ERC20Extended.at(tokens[1]);
    const beforeBalance = await erc20Token2.balanceOf(deposit);
    await erc20Token.transfer(kyberNetworkAdapter.address, 1000*10**18);
    const beforeBalance2 = await erc20Token.balanceOf(kyberNetworkAdapter.address);
    /*
    Normally srctoken is approved by exchange provider , but I don't use it, so I send it directly to kyber adapter.
    */
    await kyberNetworkAdapter.tokenExchange(tokens[0],tokens[1],1000*10**18,10**18,deposit);
    const afterBalance = await erc20Token2.balanceOf(deposit);
    const afterBalance2 = await erc20Token.balanceOf(kyberNetworkAdapter.address);
    assert.equal((afterBalance-beforeBalance), 1000*10**18 , `Success`);
    assert.equal((beforeBalance2-afterBalance2), 1000*10**18 , `Success`);
  });
  it("exchange provider should support token to stoken swap", async () => {
    const erc20Token = await ERC20Extended.at(tokens[0]);
    const erc20Token2 = await ERC20Extended.at(tokens[1]);
    const beforeBalance = await erc20Token.balanceOf(deposit);
    await erc20Token2.approve(exchangeProvider.address, 1000*10**18);
    const beforeBalance2 = await erc20Token2.balanceOf(deposit);

    await exchangeProvider.tokenExchange(tokens[1],tokens[0],1000*10**18,10**18,deposit,"");
    const afterBalance = await erc20Token.balanceOf(deposit);
    const afterBalance2 = await erc20Token2.balanceOf(deposit);
    assert.equal((afterBalance-beforeBalance), 1000*10**18 , `Success`);
    assert.equal((beforeBalance2-afterBalance2), 1000*10**18 , `Success`);
  });
});
