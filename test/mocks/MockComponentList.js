const log = require('../utils/log');
const ComponentList = artifacts.require("../../contracts/mocks/MockComponentList");
const Reimbursable = artifacts.require("../../contracts/components/reimbursable/Reimbursable.sol");


contract('ComponetList', (accounts) => {
  const investorA = accounts[1];
  let list;
  before('Mock Index Test', async () => {
    list = await ComponentList.new();
  });
  it("Set and read ", async () => log.catch(async () => {
    const reimbursable = await Reimbursable.deployed();
    await list.setComponent('reiumbrsable', 'v1', reimbursable.address);

    const component = await list.getComponent('reiumbrsable', 'v1');
    assert.equal(component, reimbursable.address);
  }))

});