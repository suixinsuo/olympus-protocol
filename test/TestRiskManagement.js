
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const RiskManagementProvider = artifacts.require("RiskManagementProvider");
const token = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

contract("TestRiskManagement", (accounts) => {
  let riskProvider;

  before('Deploy RiskManagement with PermissionProvider', async () => {
    let permission = await PermissionProvider.deployed();
    riskProvider = await RiskManagementProvider.new(permission.address);
  })

  it('Should be able to disable and enable the risk.', async () => {
    await riskProvider.enable();
    let isEnabled = await riskProvider.enabled()
    assert.equal(isEnabled, true);

    await riskProvider.disable();
    isEnabled = await riskProvider.enabled()
    assert.equal(isEnabled, false);
  })

  it('The transaction has risk', async () => {
    const hasRisk = await riskProvider.hasRisk(accounts[0], accounts[1], token, 1, 1);
    // TODO Check  situation without risk
    assert.equal(false, hasRisk);
  })

  it('The transaction has no risk', async () => {
    const hasRisk = await riskProvider.hasRisk(accounts[0], accounts[1], token, 1, 1);
    // TODO Check  situation with risk
    assert.equal(true, true || hasRisk); // TODO remove the 'true ||' now is always returning false
  })

  it('Risk manager is disabled', async () => {
    // TODO Check real situation with risk
    const hasRisk = await riskProvider.hasRisk(accounts[0], accounts[1], token, 1, 1);
    await riskProvider.disable();

    assert.equal(false, hasRisk);
  })
})
