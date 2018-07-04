const log = require("../utils/log");
const WhitelistProvider = artifacts.require("WhitelistProvider");
const MockWhitelist = artifacts.require("MockWhitelistClient");

contract("Whitelist", accounts => {
  let whitelistProvider;
  let mock;
  let balanceCategory;
  const nonAuthorizedUser = accounts[1];
  const authorizedUser = accounts[2];

  before("Deploy Whitelist Mock", async () => {
    whitelistProvider = await WhitelistProvider.deployed();
    mock = await MockWhitelist.new(whitelistProvider.address);
    balanceCategory = (await mock.CATEGORY_BALANCE()).toNumber();
  });

  it("Shall be able enable and disable", async () =>
    log.catch(async () => {
      await mock.enableWhitelist();
      assert.isTrue(await whitelistProvider.enabled.call(mock.address, balanceCategory), "Provider is enabled");

      await mock.disableWhitelist();
      assert.isFalse(await whitelistProvider.enabled.call(mock.address, balanceCategory), "Provider is disabled");

      await mock.enableWhitelist();
      assert.isTrue(await whitelistProvider.enabled.call(mock.address, balanceCategory), "Provider is enabled");
    }));

  it("Shall be able to allow users", async () =>
    log.catch(async () => {
      await mock.setAllowed([authorizedUser], true);
      await mock.setAllowed([nonAuthorizedUser], false);

      assert.isTrue(await whitelistProvider.whitelist.call(mock.address, balanceCategory, authorizedUser));
      assert.isFalse(await whitelistProvider.whitelist.call(mock.address, balanceCategory, nonAuthorizedUser));
    }));

  it("Only whitelisted can perform the action", async () =>
    log.catch(async () => {
      // Whitelisted
      await mock.updateBalance(100, { from: authorizedUser });
      assert.equal((await mock.balances.call(authorizedUser)).toNumber(), 100, "User can update balance");
      // Non whitelisted
      try {
        await mock.updateBalance(100, { from: nonAuthorizedUser });
        assert(false);
      } catch (e) {
        assert.equal((await mock.balances.call(nonAuthorizedUser)).toNumber(), 0, "User cant update balance");
      }
    }));

  it("When whitelisted is disabled, everybody can perform action", async () =>
    log.catch(async () => {
      await mock.disableWhitelist();

      // Whitelisted
      await mock.updateBalance(200, { from: authorizedUser });
      assert.equal((await mock.balances.call(authorizedUser)).toNumber(), 200, "User can update balance");

      await mock.updateBalance(200, { from: nonAuthorizedUser });
      assert.equal((await mock.balances.call(nonAuthorizedUser)).toNumber(), 200, "User cant update balance");
    }));
});
