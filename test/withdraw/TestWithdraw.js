const log = require("../utils/log");
const MockWithdraw = artifacts.require("MockWithdrawClient");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");
const SimpleWithdraw = artifacts.require("../../contracts/components/widrwaw/SimpleWithdraw.sol");
const MockToken = artifacts.require("MockToken");

const toTokenWei = amount => {
  return amount * 10 ** 18;
};

contract("Withdraw", accounts => {
  let asyncWithdraw;
  const investorA = accounts[1];
  const investorB = accounts[2];

  before("Run marketplace", async () => {
    asyncWithdraw = await AsyncWithdraw.deployed();
    let mockMot = await MockToken.new("", "MOT", 18, 10 ** 9 * 10 ** 18);
    await asyncWithdraw.setMotAddress(mockMot.address);
  });

  it("Shall be able to request and withdraw", async () => {
    const initialEthA = web3.fromWei(await web3.eth.getBalance(investorA).toNumber(), "ether");
    const initialEthB = web3.fromWei(await web3.eth.getBalance(investorB).toNumber(), "ether");

    const product1 = await MockWithdraw.new(asyncWithdraw.address);
    await product1.initialize();

    // The investor send eth
    await product1.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await product1.invest({ value: web3.toWei(1, "ether"), from: investorB });

    // Request
    await product1.requestWithdraw(toTokenWei(1), { from: investorA });
    await product1.requestWithdraw(toTokenWei(1), { from: investorB });

    assert.equal(await product1.balanceOf(investorA), toTokenWei(1), "A has invested");
    assert.equal(await product1.balanceOf(investorB), toTokenWei(1), "B has invested");

    // // Withdraw max transfers is set to 1
    await product1.withdraw();
    assert.equal(await product1.withdrawInProgress(), true, " Withdraw has not finished");
    assert.equal((await product1.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await product1.balanceOf(investorB)).toNumber(), toTokenWei(1), " B has no withdrawn");

    // Second withdraw succeeds
    await product1.withdraw();
    assert.equal(await product1.withdrawInProgress(), false, " Withdraw has finished");
    assert.equal((await product1.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");

    const endEthA = web3.fromWei(await web3.eth.getBalance(investorA).toNumber(), "ether");
    const endEthB = web3.fromWei(await web3.eth.getBalance(investorB).toNumber(), "ether");
    // They finish as they start
    assert.equal(Math.round(initialEthA), Math.round(endEthA), "A  recover ETH");
    assert.equal(Math.round(initialEthB), Math.round(endEthB), "B recover ETH");
    assert.equal(Math.round(initialEthB), Math.round(initialEthB), "B  recover ETH");
  });

  it("Test request withdraw and transfer tokens before withdraw executes", async () => {
    const product1 = await MockWithdraw.new(asyncWithdraw.address);
    await product1.initialize();

    await product1.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await product1.requestWithdraw(toTokenWei(1), { from: investorA });
    // Now we try to fool, and send our derivative tokens to another account
    await product1.transfer(investorB, toTokenWei(0.5), { from: investorA });

    await product1.withdraw(); // Will not withdraw, but skip the transaction

    const tokenBalanceA = (await product1.balanceOf(investorA)).toNumber();
    const tokenBalanceB = (await product1.balanceOf(investorB)).toNumber();

    assert.equal(tokenBalanceA, toTokenWei(0.5), "A has no withdraw nothing");
    assert.equal(tokenBalanceB, toTokenWei(0.5), "B has A tokens");
    assert.isFalse(await product1.withdrawInProgress(), "Withdraw has finished");
    assert.equal(await product1.totalWithdrawPending(), 0, "Withdraw has finished");
  });

  it("Most simple implementation of withdraw", async () => {
    let mockMot = await MockToken.new("", "MOT", 18, 10 ** 9 * 10 ** 18);
    const instance = await SimpleWithdraw.deployed();
    await instance.setMotAddress(mockMot.address);

    const product1 = await MockWithdraw.new(instance.address);
    await product1.initialize();

    await product1.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await product1.requestWithdraw(toTokenWei(1), { from: investorA });
    await product1.withdraw();

    assert.equal((await product1.balanceOf(investorA)).toNumber(), 0, "B has withdraw");
  });
});
