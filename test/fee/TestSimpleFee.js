const log = require("../utils/log");
const calc = require("../utils/calc");
const PercentageFee = artifacts.require("PercentageFee");
const MockFeeClient = artifacts.require("MockFeeClient");
const MockToken = artifacts.require("MockToken");

const FEE = 0.1; // 10%
const toTokenWei = amount => {
  return amount * 10 ** 18;
};

contract("Fee", accounts => {
  const investorA = accounts[1];

  it("Shall be able execute Simple fee", async () => {
    const fee = await PercentageFee.new();
    let mockMot = await MockToken.new("", "MOT", calc.getRandomDecimals(), 10 ** 9 * 10 ** 18);
    await fee.setMotAddress(mockMot.address);

    const client = await MockFeeClient.new(fee.address);
    await client.initialize();
    await client.setFee((await client.feeDenominator()).toNumber() * FEE);
    await client.invest({ value: web3.toWei(1, "ether"), from: investorA });
    // Fee has been applied
    assert.equal((await client.balanceOf(investorA)).toNumber(), toTokenWei(0.9));
  });
});
