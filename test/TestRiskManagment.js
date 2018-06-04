
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const RiskManagmentProvider = artifacts.require("RiskManagmentProvider");
const token = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

contract.only("TestRiskManagment", (accounts) => {
  let riskProvider;

  before('Deploy RiskManagment with PermissionProvider', async () => {
    let permission = await PermissionProvider.deployed();
    riskProvider = await RiskManagmentProvider.new(permission.address);
  })

  it('Should be able to disable and enable the risk.', async () => {
    await riskProvider.enable();
    let isEnabled = await riskProvider.enabled()
    assert.equal(isEnabled, true);

    await riskProvider.disable();
    isEnabled = await riskProvider.enabled()
    assert.equal(isEnabled, false);
  })

  it.only('Should check the risk', async () => {
    const hasRisk = await riskProvider.hasRisk(accounts[0], accounts[1], token, 1);
    // TODO Check real situation
    assert.equal(true, hasRisk);
  })
})
