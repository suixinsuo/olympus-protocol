const RebalanceMock = artifacts.require("../contracts/RebalanceMock.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const TX_OK = '0x01';

contract('RebalanceMock', (accounts) => {

  it("Should be able to deploy.", async () => {
    return await Promise.all([
      RebalanceMock.deployed(),
    ]).spread((rebalanceMock) => {
      assert.ok(rebalanceMock, 'RebalanceMock contract is not deployed.');
    });
  });

  it("Should be able to do a rebalance for > 10 (token_step) tokens.", async () => {
    try {
      let instance = await RebalanceMock.deployed();
      let tokenBalances = await instance.getTokenBalances.call();
      let initialTokenValues = await instance.getTokenValues.call();

      let firstResult = await instance.rebalance.call();
      let firstTransactionResult = await instance.rebalance();
      assert.equal(firstResult, false);
      assert.equal(firstTransactionResult.receipt.status, TX_OK);

      let secondResult = await instance.rebalance.call();
      let secondTransactionResult = await instance.rebalance();
      assert.equal(secondResult, true);
      assert.equal(secondTransactionResult.receipt.status, TX_OK);
      const finalTotalValue = (await instance.getTotalIndexValue.call()).toNumber();
      let finalTokenBalances = (await instance.getTokenBalances.call()).map((bigNo) => bigNo.toNumber());
      let finalTokenValues = (await instance.getTokenValues.call()).map((bigNo) => bigNo.toNumber());

      // For the first 10 tokens, check if the percentage of the totalValue is still 5 percent
      // For the last 5 tokens, it should still be 10 percent
      finalTokenValues.forEach((finalValue, index) => {
        assert.equal(finalValue, index < 10 ? finalTotalValue * 0.05 : finalTotalValue * 0.1);
      });

    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Should be able to do a rebalance after changing the price for more tokens.", async () => {
    try {
      let instance = await RebalanceMock.deployed();
      let result = await instance.changeNormalMockPrice(50);
      let firstResult = await instance.rebalance.call();
      let firstTransactionResult = await instance.rebalance();
      assert.equal(firstResult, false);

      assert.equal(firstTransactionResult.receipt.status, TX_OK);

      let secondResult = await instance.rebalance.call();
      let secondTransactionResult = await instance.rebalance();
      assert.equal(secondResult, true);
      assert.equal(secondTransactionResult.receipt.status, TX_OK);
      const finalTotalValue = (await instance.getTotalIndexValue.call()).toNumber();
      let finalTokenValues = (await instance.getTokenValues.call()).map((bigNo) => bigNo.toNumber());
      console.log(finalTokenValues);
      // For the first 10 tokens, check if the percentage of the totalValue is still 5 percent
      // For the last 5 tokens, it should still be 10 percent
      finalTokenValues.forEach((finalValue, index) => {
        assert.equal(finalValue, index < 10 ? finalTotalValue * 0.05 : finalTotalValue * 0.1);
      });

    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
