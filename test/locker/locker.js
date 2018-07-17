const Locker = artifacts.require("Locker");
const calc = require("../utils/calc");

let locker;
contract("Locker", accounts => {
  it("checkLock.", async () => {
    locker = await Locker.deployed()
    assert.ok(locker, "Locker contract is not deployed.");

    calc.shouldSuccess(locker.setIntervalHours("lock", 1000),
      "CheckLock in first time shouldn't be reverted")

    try {
      await locker.checkLockByHours("lock")
    } catch (e) {
      assert(false, "should't be revert")
    }

    await calc.assertReverts(
      async () =>
        await locker.checkLockByHours("lock"),
      "Shall revert"
    );
  });
});
