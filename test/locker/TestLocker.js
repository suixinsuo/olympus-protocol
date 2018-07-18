const Locker = artifacts.require("Locker");
const calc = require("../utils/calc");

let locker;
contract("Locker", accounts => {
  it("checkLock.", async () => {
    let tx;
    locker = await Locker.deployed();
    assert.ok(locker, "Locker contract is not deployed.");

    tx = await locker.checkLockByHours("lock");
    assert.ok(tx);

    tx = await locker.setIntervalHours("lock", 10);
    assert.ok(tx);

    await calc.assertReverts(async () => await locker.checkLockByHours("lock"), "Shall revert");
  });
});
