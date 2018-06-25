const log = require('../utils/log');
const ComponentList = artifacts.require("ComponentList");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");

const Reimbursable = artifacts.require("../../contracts/components/reimbursable/Reimbursable.sol");


contract('ComponetList', (accounts) => {
  const investorA = accounts[1];
  let list;
  before('Mock Index Test', async () => {
    list = await ComponentList.new();
  });
  it("Set and read ", async () => log.catch(async () => {
    const reimbursable = await  Reimbursable.deployed();
    await list.setComponent('reiumbrable', reimbursable.address);

    const element = await list.getComponent('reiumbrsable');
    assert.equal(element.address, reimbursable.address);
  }))

});
