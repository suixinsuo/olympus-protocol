const log = require('../utils/log');
const FundInstance = artifacts.require("../../contracts/components/mocks/MockFund.sol");


contract('Mock Fund', (accounts) => {
  let fund;
  const investorA = accounts[1];
  const investorB = accounts[2];

  before('Mock Fund Test', async () => {
    fund = await FundInstance.deployed();
  });

  it("Fund shall deploy", async () => log.catch(async () => {
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorB });

    assert.equal((await fund.totalSupply()).toNumber(), web3.toWei(2, 'ether'));

    // fund.buyTokens('',)
  }));


});
