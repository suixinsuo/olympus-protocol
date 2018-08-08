'use strict';

// const log = require('../utils/log');
const MockMappeable = artifacts.require("MockMappeableDerivative");
const TokenBroken = artifacts.require("TokenBroken");



contract('Test Mock Mappeable', (accounts) => {
  let mock;

  before('Mock Index Test', async () => {
    mock = await MockMappeable.new();
  });

  it("Should be able to map active investors", async () => {
    const totalInvestors = 5;
    const ether1 = web3.toWei(1, 'ether');
    let i;
    let activeInvestors = [];

    for (i = 0; i < totalInvestors; i++) {
      await mock.invest({ value: ether1, from: accounts[i] });
    }

    activeInvestors = await mock.getActiveInvestors();

    for (i = 0; i < totalInvestors; i++) {
      assert.equal(activeInvestors[i], accounts[i], 'Active investors is correct');
      assert.equal((await mock.balanceOf(activeInvestors[i])).toNumber(), ether1, 'Balance is correct');
    }

    // none numbers withdraw
    for (i = 0; i < totalInvestors; i++) {
      if (i % 2 == 1) { continue; }
      await mock.requestWithdraw(ether1, { from: accounts[i] });
    }

    activeInvestors = await mock.getActiveInvestors();

    // Only even pending
    assert.equal(activeInvestors.length, 2, 'Only evens are active');
    for (i = 0; i < activeInvestors.length; i++) {
      assert.equal(activeInvestors[i], accounts[i * 2 + 1], 'Only even active');
    }

    // even numbers withdraw
    for (i = 0; i < totalInvestors; i++) {
      if (i % 2 == 0) { continue; }
      await mock.requestWithdraw(ether1, { from: accounts[i] });
    }

    activeInvestors = await mock.getActiveInvestors();

    // No active investors
    assert.equal(activeInvestors.length, 0, 'No active investors ');

  })
});
