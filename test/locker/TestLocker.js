const Locker = artifacts.require("Locker");
const calc = require("../utils/calc");

let locker;
contract("Locker", accounts => {
  it("Check Time lock", async () => {
    let tx;
    const category = "Lock";
    const time = 5;
    locker = await Locker.deployed();
    assert.ok(locker, "Locker contract is not deployed.");

    tx = await locker.setTimeInterval(category, time);
    assert.ok(tx);

    tx = await locker.checkLockerByTime(category); // First time is ok
    assert.ok(tx);

    await calc.assertReverts(async () => await locker.checkLockerByTime("lock"), "Shall revert");

    await calc.waitSeconds(time);
    // Time pass, now is ok agian
    tx = await locker.checkLockerByTime(category);
    assert.ok(tx);
  });

  it("Check Times Locks", async () => {
    let tx;
    const categories = ["Lock1", "Lock2"];
    const times = [10, 10];
    locker = await Locker.deployed();
    assert.ok(locker, "Locker contract is not deployed.");

    tx = await locker.setMultipleTimeIntervals(categories, times);
    assert.ok(tx);

    assert.equal((await locker.timeInterval(accounts[0], categories[0])).toNumber(), times[0], "Category 0 set");
    assert.equal((await locker.timeInterval(accounts[0], categories[1])).toNumber(), times[1], "Category 1 set");
  });

  it("Check Block lock", async () => {
    let tx;
    const category = "Block";
    const time = 5;
    locker = await Locker.deployed();
    assert.ok(locker, "Locker contract is not deployed.");

    tx = await locker.setBlockInterval(category, time);
    assert.ok(tx);

    tx = await locker.checkLockByBlockNumber(category); // First time is ok
    assert.ok(tx);

    await calc.assertReverts(async () => await locker.checkLockByBlockNumber("lock"), "Shall revert");

    await calc.waitSeconds(time);
    // Time pass, now is ok agian
    tx = await locker.checkLockerByTime(category);
    assert.ok(tx);
  });

  it("Check Block Locks", async () => {
    let tx;
    const categories = ["Block1", "Block2"];
    const times = [10, 10];
    locker = await Locker.deployed();
    assert.ok(locker, "Locker contract is not deployed.");

    tx = await locker.setMultipleBlockIntervals(categories, times);
    assert.ok(tx);

    assert.equal((await locker.blockInterval(accounts[0], categories[0])).toNumber(), times[0], "Category 0 set");
    assert.equal((await locker.blockInterval(accounts[0], categories[1])).toNumber(), times[1], "Category 1 set");
  });
});
