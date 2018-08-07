'use strict';

const MockDerivative = artifacts.require("MockTokenBroken");
const TokenBroken = artifacts.require("TokenBroken");
const MOT = artifacts.require("MockToken");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");


contract('Token Broken', (accounts) => {
  let mock;
  let mot;
  let tokenBroken;
  const ether1 = web3.toWei(1, 'ether');

  before('Mock Index Test', async () => {
    tokenBroken = await TokenBroken.deployed();
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

    // Simulation to get the array
    const balancesToWihtdraw = await mock.setBrokenToken.call(mot.address);

    // Check proportion
    for (let i = 0; i < investmentPercentage.length; i++) {
      assert.equal(balancesToWihtdraw[i].toNumber(), motAmount * investmentPercentage[i], 'Balance is as per holder percentage');
    }

    // Real code to check the internal state
    await mock.setBrokenToken(mot.address);


    // Check the internal data is safe correctly
    for (let i = 0; i < investmentPercentage.length; i++) {
      let providerBalance = await tokenBroken.tokenBalances(mock.address, mot.address, accounts[i]);
      assert.equal(providerBalance.toNumber(), motAmount * investmentPercentage[i], 'Balance is as kept in the provider');
    }

    const totalInvestors = await tokenBroken.balancePendingLength(mock.address, mot.address);
    assert.equal(totalInvestors, investmentPercentage.length, 'Total Investors pending');

  })
});
