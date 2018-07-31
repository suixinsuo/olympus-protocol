"use strict";

const MockKyberNetwork = artifacts.require("exchanges/MockKyberNetwork");
const RiskControl = artifacts.require("RiskControl");
const MockToken = artifacts.require("MockToken");
const MockFeeChargerFund = artifacts.require("MockFeeChargerFund");
const ERC20Extended = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeProvider = artifacts.require("ExchangeProvider");
const Promise = require("bluebird");
const ethToken = "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const expectedRate = web3.toBigNumber("1000" + "000000000000000000");
const expectedRateToSell = web3.toBigNumber("1000000000000000");
const calc = require("../utils/calc");

contract("FeeCharger", accounts => {
  let mockFund;
  let mockMOT;
  let risk;
  let exchange;
  let tokens;
  const depositMOTAccount = accounts[1];

  before("MockFeeChargerFund should be able to deploy.", async () => {
    return await Promise.all([
      MockKyberNetwork.deployed(),
      MockToken.deployed(),
      ExchangeProvider.deployed(),
      RiskControl.deployed()
    ]).spread(async (mockKyberNetwork, mot, exchangeProvider, riskControl) => {
      assert.ok(mot, "MOT contract is not deployed.");
      assert.ok(exchangeProvider, "ExchangeProvider contract is not deployed.");
      assert.ok(riskControl, "RiskControl contract is not deployed.");

      await riskControl.setMotAddress(mot.address);
      await exchangeProvider.setMotAddress(mot.address);

      tokens = await mockKyberNetwork.supportedTokens();
      mockMOT = mot;
      risk = riskControl;
      exchange = exchangeProvider;
      mockFund = await MockFeeChargerFund.new(riskControl.address, exchangeProvider.address);
      await mockFund.initialize();

      const balance = (await mockMOT.balanceOf(accounts[0])).toNumber();
      // send MOT in to mockFund.
      await mockMOT.transfer(mockFund.address, balance / 2, { from: accounts[0] });

      assert.equal(balance / 2, (await mockMOT.balanceOf(mockFund.address)).toNumber());
      assert.equal(0, (await mockMOT.balanceOf(depositMOTAccount)).toNumber());

      // send ETHs into mockFund.
      let ethBalance = await calc.ethBalance(mockFund.address);
      if (ethBalance < 2) {
        await mockFund.send(web3.toWei(2, "ether"));
        ethBalance = await calc.ethBalance(mockFund.address);
      }

      assert.isAtLeast(ethBalance, 2, "MockFund should have 2 eths");
    });
  });

  it("should be able to call from depositMOTAccount when there is no MOT available becasue fee is zero.", async () => {
    let result;
    // per call.
    assert.equal(0, (await mockMOT.balanceOf(depositMOTAccount)).toNumber());
    assert.equal(0, (await risk.feeAmount()).toNumber());
    assert.equal(0, (await exchange.feePercentage()).toNumber());

    try {
      result = await mockFund.hasRisk(accounts[0], depositMOTAccount, mockMOT.address, 0, 0, {
        from: depositMOTAccount
      });
      assert.ok(result, "should be able to call without MOT.");
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }

    // per tx
    assert.isAtLeast(await calc.ethBalance(mockFund.address), 2, "MockFund should have 2 eths");
    try {
      result = await mockFund.buyToken(tokens[0], 10 ** 18, expectedRate, {
        from: depositMOTAccount,
        value: 10 ** 18
      });
      assert.ok(result, "should be able to call without MOT.");
      assert.isAbove(
        (await ERC20Extended.at(tokens[0]).balanceOf(mockFund.address)).toNumber(),
        0,
        "Token should have been bought"
      );
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });

  it("should be able to adjust fee parameters.", async () => {
    let result;
    // risk call per time 10 ** 17 = 0.1 MOT;
    result = await risk.adjustFeeAmount(10 ** 17);
    assert.ok(result);

    // exchange call percentage is 1%;
    result = await exchange.adjustFeePercentage(100);
    assert.ok(result);

    result = await risk.setWalletId(depositMOTAccount);
    assert.ok(result);

    result = await exchange.setWalletId(depositMOTAccount);
    assert.ok(result);
  });

  it("should not be able to call from depositMOTAccount when there is no MOT available", async () => {
    let result;

    assert.equal(0, (await mockMOT.balanceOf(depositMOTAccount)).toNumber());

    // risk
    assert.isAbove((await risk.feeAmount()).toNumber(), 0, "fee amount should be greater than zero");

    try {
      result = await mockFund.hasRisk(accounts[0], depositMOTAccount, mockMOT.address, 0, 0, {
        from: depositMOTAccount
      });
      assert.ok(false, "should not be able to call without MOT.");
    } catch (e) {
      assert.ok(true, "should revert without MOT.");
    }

    // exchange
    assert.isAbove((await exchange.feePercentage()).toNumber(), 0, "fee percentage should be greater than zero.");

    try {
      result = await mockFund.buyToken(tokens[0], 1000, expectedRate, {
        from: depositMOTAccount
      });
      assert.ok(false, "should not be able to call without MOT.");
    } catch (e) {
      assert.ok(true, "should revert");
    }
  });

  it("should charge MOT fee per call and send to depositMOTAccount", async () => {
    let account1Balance = (await mockMOT.balanceOf(depositMOTAccount)).toNumber();
    assert.isAbove((await mockMOT.balanceOf(accounts[0])).toNumber(), 0, "accounts[0] should have MOT.");
    const feeAmount = (await risk.feeAmount()).toNumber();
    // risk
    assert.isAbove(feeAmount, 0, "fee amount should be greater than zero");

    const fundMOTBalance = (await mockMOT.balanceOf(mockFund.address)).toNumber();
    assert.isAbove(fundMOTBalance, feeAmount, "MOT balance is more than fee amount.");

    let result;
    try {
      result = await mockFund.hasRisk(accounts[0], depositMOTAccount, mockMOT.address, 0, 0);
      assert.ok(result, "should be able to call from accounts[0]");
      // depositMOTAccount should have MOT.
      assert.equal((await mockMOT.balanceOf(depositMOTAccount)).toNumber(), feeAmount + account1Balance);
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });

  it("should charge MOT fee per tx and send to depositMOTAccount// buy token", async () => {
    let account1Balance = (await mockMOT.balanceOf(depositMOTAccount)).toNumber();
    assert.isAbove((await mockMOT.balanceOf(accounts[0])).toNumber(), 0, "accounts[0] should have MOT.");

    const amount = 10 ** 18; // 1 eth
    const amountInMot = (amount * expectedRate) / 10 ** 18;
    const feePercentage = (await exchange.feePercentage()).toNumber();

    const feeAmount = (amountInMot * feePercentage) / (await exchange.FEE_CHARGER_DENOMINATOR());
    assert.isAbove(feePercentage, 0);
    assert.isAbove(feeAmount, 0, "fee amout should be greater than zero.");

    const fundMOTBalance = (await mockMOT.balanceOf(mockFund.address)).toNumber();
    assert.isAbove(fundMOTBalance, feeAmount, "MOT balance is more than fee amount.");

    let result;
    try {
      result = await mockFund.buyToken(tokens[0], amount, expectedRate, {
        value: amount
      });
      assert.ok(result, "should be able to call by tx");
      // depositMOTAccount should have MOT.
      assert.equal((await mockMOT.balanceOf(depositMOTAccount)).toNumber(), feeAmount + account1Balance);
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });

  it("should charge MOT fee per tx and send to depositMOTAccount// buy tokens", async () => {
    let account1Balance = (await mockMOT.balanceOf(depositMOTAccount)).toNumber();
    assert.isAbove((await mockMOT.balanceOf(accounts[0])).toNumber(), 0, "accounts[0] should have MOT.");

    const amount = 10 ** 18; // 1 eth
    const amountInMot = (amount * expectedRate) / 10 ** 18;
    const feePercentage = (await exchange.feePercentage()).toNumber();

    const feeAmount = (amountInMot * feePercentage) / (await exchange.FEE_CHARGER_DENOMINATOR());
    assert.isAbove(feePercentage, 0);
    assert.isAbove(feeAmount, 0, "fee amout should be greater than zero.");

    const fundMOTBalance = (await mockMOT.balanceOf(mockFund.address)).toNumber();
    assert.isAbove(fundMOTBalance, feeAmount, "MOT balance is more than fee amount.");

    let result;
    try {
      result = await mockFund.buyTokens(tokens, [amount / 2, amount / 2], [expectedRate, expectedRate], {
        value: amount
      });
      assert.ok(result, "should be able to call by tx");
      // depositMOTAccount should have MOT.
      assert.equal((await mockMOT.balanceOf(depositMOTAccount)).toNumber(), feeAmount + account1Balance);
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });

  it("should charge MOT fee per tx and send to depositMOTAccount// sell token", async () => {
    let account1Balance = (await mockMOT.balanceOf(depositMOTAccount)).toNumber();
    assert.isAbove((await mockMOT.balanceOf(accounts[0])).toNumber(), 0, "accounts[0] should have MOT.");

    const amount = 1000 * 10 ** 18; // 1000 tokens
    const amountInWei = (amount * expectedRateToSell) / 10 ** 18;
    const amountInMot = (amountInWei * expectedRate) / 10 ** 18;
    const feePercentage = (await exchange.feePercentage()).toNumber();

    const feeAmount = (amountInMot * feePercentage) / (await exchange.FEE_CHARGER_DENOMINATOR());
    assert.isAbove(feePercentage, 0);
    assert.isAbove(feeAmount, 0, "fee amout should be greater than zero.");

    const fundMOTBalance = (await mockMOT.balanceOf(mockFund.address)).toNumber();
    assert.isAbove(fundMOTBalance, feeAmount, "MOT balance is more than fee amount.");

    let result;
    try {
      result = await mockFund.sellToken(tokens[0], amount, expectedRateToSell);
      assert.ok(result, "should be able to call by tx");
      // depositMOTAccount should have MOT.
      assert.equal((await mockMOT.balanceOf(depositMOTAccount)).toNumber(), account1Balance + feeAmount);
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });

  it("should charge MOT fee per tx and send to depositMOTAccount// sell tokens", async () => {
    let account1Balance = (await mockMOT.balanceOf(depositMOTAccount)).toNumber();
    assert.isAbove((await mockMOT.balanceOf(accounts[0])).toNumber(), 0, "accounts[0] should have MOT.");

    const amount = 1000 * 10 ** 18; // 1000 tokens
    const amountInWei = (amount * expectedRateToSell) / 10 ** 18;
    const amountInMot = (amountInWei * expectedRate) / 10 ** 18;
    const feePercentage = (await exchange.feePercentage()).toNumber();

    const feeAmount = (amountInMot * feePercentage) / (await exchange.FEE_CHARGER_DENOMINATOR());
    assert.isAbove(feePercentage, 0);
    assert.isAbove(feeAmount, 0, "fee amout should be greater than zero.");

    const fundMOTBalance = (await mockMOT.balanceOf(mockFund.address)).toNumber();
    assert.isAbove(fundMOTBalance, feeAmount, "MOT balance is more than fee amount.");

    let result;
    try {
      result = await mockFund.sellTokens(tokens, [amount / 2, amount / 2], [expectedRateToSell, expectedRateToSell]);
      assert.ok(result, "should be able to call by tx");
      // depositMOTAccount should have MOT.
      assert.equal((await mockMOT.balanceOf(depositMOTAccount)).toNumber(), account1Balance + feeAmount);
    } catch (e) {
      console.warn(e);
      assert.ok(false, "should not revert");
    }
  });
});
