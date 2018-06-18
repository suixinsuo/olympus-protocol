const log = require('../utils/log');
const MockWithdraw = artifacts.require("MockWithdrawClient");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");
const Simpleithdraw = artifacts.require("../../contracts/components/widrwaw/SimpleWithdraw.sol");

const toToken = (amount) => {
  return amount * 10 ** 18;
}

contract('Withdraw', (accounts) => {
  let asyncWithdraw;
  const investorA = accounts[1];
  const investorB = accounts[2];

  before('Run marketplace', async () => {
    asyncWithdraw = await AsyncWithdraw.deployed();
  });

  it("Shall be able to request and withdraw", async () => log.catch(async () => {
    const initialEthA = web3.fromWei(await web3.eth.getBalance(investorA).toNumber(), 'ether');
    const initialEthB = web3.fromWei(await web3.eth.getBalance(investorB).toNumber(), 'ether');


    const product1 = await MockWithdraw.new(asyncWithdraw.address);

    // The investor send eth
    await product1.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    await product1.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorB });

    // Request
    await product1.requestWithdraw(toToken(1), { from: investorA });
    await product1.requestWithdraw(toToken(1), { from: investorB });

    assert.equal(await product1.balanceOf(investorA), toToken(1), 'A has invested');
    assert.equal(await product1.balanceOf(investorB), toToken(1), 'B has invested');

    // // Withdraw max transfers is set to 1
    await product1.withdraw();
    assert.equal(await product1.withdrawInProgress(), true, ' Withdraw has not finished');
    assert.equal((await product1.balanceOf(investorA)).toNumber(), 0, ' A has withdraw');
    assert.equal((await product1.balanceOf(investorB)).toNumber(), toToken(1), ' B has no withdraw');

    // Second withdraw succeeds
    await product1.withdraw();
    assert.equal(await product1.withdrawInProgress(), false, ' Withdraw has finished');
    assert.equal((await product1.balanceOf(investorB)).toNumber(), 0, 'B has withdraw');

    const endEthA = web3.fromWei(await web3.eth.getBalance(investorA).toNumber(), 'ether');
    const endEthB = web3.fromWei(await web3.eth.getBalance(investorB).toNumber(), 'ether');
    // They finish as they start
    assert.equal(Math.round(initialEthA), Math.round(endEthA), 'A  recover ETH');
    assert.equal(Math.round(initialEthB), Math.round(endEthB), 'B recover ETH'); assert.equal(Math.round(initialEthB), Math.round(initialEthB), 'B  recover ETH');


  }));
  it("Most simple implementation of withdraw", async () => log.catch(async () => {
    const product1 = await MockWithdraw.new((await Simpleithdraw.deployed()).address);

    await product1.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    await product1.requestWithdraw(toToken(1), { from: investorA });
    await product1.withdraw();

    assert.equal((await product1.balanceOf(investorA)).toNumber(), 0, 'B has withdraw');

  }));

});
