'use strict';

// const log = require('../utils/log');
const MockDerivative = artifacts.require("MockTokenBroken");
const TokenBroken = artifacts.require("TokenBroken");
const MOT = artifacts.require("MockToken");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");


contract('Token Broken', (accounts) => {
  let mock;
  let mot;
  const ether1 = web3.toWei(1, 'ether');

  before('Mock Index Test', async () => {
    const tokenBroken = await TokenBroken.deployed();
    mot = await MOT.deployed();

    mock = await MockDerivative.new(tokenBroken.address);
  });

  it("Should return balance as per supply percentage", async () => {
    const investmentPercentage = [0.5, 0.25, 0.15, 0.10]; // Ether Percentage investied
    const motAmount = 10 ** 21;

    mot.transfer(mock.address, motAmount); // Transfer 1000 MOT
    for (let i = 0; i < investmentPercentage.length; i++) {
      await mock.invest({ value: ether1 * investmentPercentage[i], from: accounts[i] });
    }
    console.log((await mock.totalSupply()).toNumber());
    console.log((await mot.decimals()).toNumber());

    console.log((await mock.balanceOf(accounts[0])).toNumber());
    console.log((await mock.balanceOf(accounts[1])).toNumber());

    const balancesToWihtdraw = await mock.setBrokenToken(mot.address);

    console.log(balancesToWihtdraw.map((balance) => balance.toNumber()));
    // Check proportion
    for (let i = 0; i < investmentPercentage.length; i++) {
      assert.equal(balancesToWihtdraw[i], motAmount * investmentPercentage[i], 'Balance is as per holder percentage');
    }
  })
});
