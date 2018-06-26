const log = require('./utils/log');
const ComponentList = artifacts.require("../contracts/ComponentList");
const Reimbursable = artifacts.require("../contracts/components/reimbursable/Reimbursable.sol");


contract('ComponetList', (accounts) => {
  let list;
  before('ComponentList Test', async () => {
    list = await ComponentList.new();
  });
  it("Set and Get ", async () => log.catch(async () => {
    const reimbursable = await Reimbursable.deployed();
    await list.setComponent('reiumbrsable', reimbursable.address, { from: accounts[0] });
    const component = await list.getComponent('reiumbrsable', await reimbursable.version());
    assert.equal(component, reimbursable.address, 'Checking the address is correct');
  }))

});