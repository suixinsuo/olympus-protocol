const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const WhitelistProvider = artifacts.require("WhitelistProvider");

contract("TestWhitelist", (accounts) => {
  let whitelistProvider;
  before('Deploy WhitelistProvider and PermissionProvider', async () => {
    let permission = await PermissionProvider.deployed();
    whitelistProvider = await WhitelistProvider.new(permission.address);
  })

  it('Should be able to disable and enable the whitelist.', async () => {

    await whitelistProvider.enable();
    let isEnabled = await whitelistProvider.enabled()
    assert.equal(isEnabled, true);

    await whitelistProvider.disable();
    isEnabled = await whitelistProvider.enabled()
    assert.equal(isEnabled, false);

    isEnabled = await whitelistProvider.isAllowed(accounts[0]);
    assert.equal(isEnabled, true);

    await whitelistProvider.enable();
    isEnabled = await whitelistProvider.isAllowed(accounts[0]);
    assert.equal(isEnabled, false);

    await whitelistProvider.setAllowed(accounts, true);
    for (let i = 0; i < accounts.length; i++) {
      isEnabled = await whitelistProvider.isAllowed(accounts[i]);
      assert.equal(isEnabled, true);
    }

    await whitelistProvider.setAllowed(accounts, false);
    for (let i = 0; i < accounts.length; i++) {
      isEnabled = await whitelistProvider.isAllowed(accounts[i]);
      assert.equal(isEnabled, false);
    }
  })
})
