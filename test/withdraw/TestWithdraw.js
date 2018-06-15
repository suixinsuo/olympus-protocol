const log = require('../utils/log');
const MockWithdraw = artifacts.require("MockWithdrawClient");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");

const toToken = (amount) => {
  return amount * 10 ** 18;
}

contract('Withdraw', (accounts) => {
  let asyncWithdraw;
  const investorA = accounts[0];
  const investorB = accounts[1];

  before('Run marketplace', async () => {
    asyncWithdraw = await AsyncWithdraw.deployed();
  });

  it("Shall be able to request and withdraw", async () => log.catch(async () => {
    const product1 = await MockWithdraw.new(asyncWithdraw.address);

    // The investor send eth
    await product1.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    await product1.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorB });


    await product1.requestWithdraw(toToken(1), { from: investorA });
    await product1.requestWithdraw(toToken(1), { from: investorB });

    assert.equal(await product1.balanceOf(investorA), toToken(2));
    assert.equal(await product1.balanceOf(investorB), toToken(2));

    // // Withdraw max transfers is set to 1
    // const tx1 = await product1.withdraw();
    // assert.equal(parseInt(tx1.receipt.status, 16), 0);
    // assert.equal(await product1.balanceOf(investorA), 0);
    // assert.equal(await product1.balanceOf(investorB), toToken(2));

    // // Second withdraw succeeds
    // const tx2 = await product1.withdraw();
    // assert.equal(parseInt(tx2.receipt.status, 16), 1);
    // assert.equal(await product1.balanceOf(investorB), 0);
  }));

});
