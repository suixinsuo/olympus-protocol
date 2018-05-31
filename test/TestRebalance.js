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
      console.log('initial tokenBalances', tokenBalances);
      let firstResult = await instance.rebalance.call();
      let firstTransactionResult = await instance.rebalance();
      assert.equal(firstResult, false);
      assert.equal(firstTransactionResult.receipt.status, TX_OK);

      let secondResult = await instance.rebalance.call();
      let secondTransactionResult = await instance.rebalance();
      assert.equal(secondResult, true);
      assert.equal(secondTransactionResult.receipt.status, TX_OK);
      let finalTokenBalances = await instance.getTokenBalances.call();
      console.log('final tokenBalances', finalTokenBalances);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
