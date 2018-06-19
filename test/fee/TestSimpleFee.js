const log = require('../utils/log');
const PercentageFee = artifacts.require("PercentageFee");
const MockFeeClient = artifacts.require("MockFeeClient");


const FEE = 0.1; // 10%
const toToken = (amount) => {
  return amount * 10 ** 18;
}

contract('Fee', (accounts) => {
  const investorA = accounts[1];

  it("Shall be able execute AutomaticFee", async () => log.catch(async () => {
    const fee = await PercentageFee.new();
    const client = await MockFeeClient.new(fee.address);

    await client.setFee((await client.feeDenominator()).toNumber() * FEE);

    await client.invest({ value: web3.toWei(1, 'ether'), from: investorA });
    // Fee has been applied
    assert.equal((await client.balanceOf(investorA)).toNumber(), toToken(0.9));

  }))

});
