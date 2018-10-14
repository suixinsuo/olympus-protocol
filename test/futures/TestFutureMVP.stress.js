const calc = require("../utils/calc");
const BigNumber = web3.BigNumber;

const {
  FutureDirection,
  DerivativeStatus,
} = require("../utils/constants");

const futureUtils = require("./futureUtils");
const futureData = futureUtils.futureData;

/**
 *   =================   SPECIAL SCENARIOS =================
 *   When adding scenarios to the test make sure.
 *    1. Create a new future each test.
 *    2. Comment all global settings you modify in the chain.
 *    3. Reset all global settings at the end of each test
 *    4. Every test must be run if set it.only without parent dependency
 */

contract("Test Future MVP Stress", accounts => {

  let providers;

  const groupA = accounts.slice(1, 11);
  const groupB = accounts.slice(11, 21);
  const groupAll = accounts.slice(1, 21);

  let longToken; // FutureERC721Token
  let shortToken; // FutureERC721Token

  before("Initialize ComponentList", async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  it.only("Create a future", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);

    assert.equal((await future.status()).toNumber(), 1); // Active

    assert.equal(await longToken.owner(), future.address);
    assert.equal((await longToken.tokenPosition()).toNumber(), FutureDirection.Long, 'Long token is long');

    assert.equal(await shortToken.owner(), future.address);
    assert.equal((await shortToken.tokenPosition()).toNumber(), FutureDirection.Short, 'Short token is short');

  });

  //  Stress test case 1:
  //  Investors invest in long with a random price between 0.9 and 1.1 ETH
  //  10 investor invest long, other 10 invest short.
  //  With random price between 0.85 and 1.15 ETH we check positions 5 times.
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0.
  it("Stress test case 1 ", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);
    const amountsOfShares = 2;

    await Promise.all(
      groupA.map(
        async account => {
          const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
          await future.setTargetPrice(targetPrice);
          const tx = await futureUtils.safeInvest(future, FutureDirection.Long, amountsOfShares, account);
          assert.ok(tx, 'invest should not be revert');
        }
      )
    );

    await Promise.all(
      groupB.map(
        async (account, index) => {
          const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
          await future.setTargetPrice(targetPrice);
          const tx = await futureUtils.safeInvest(future, FutureDirection.Short, amountsOfShares, account);
          assert.ok(tx, 'invest should not be revert');
        }
      )
    );

    for (let i = 0; i < groupB.length; i++) {
      const account = groupB[i];
      const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
      await future.setTargetPrice(targetPrice);
      const tx = await futureUtils.safeInvest(future, FutureDirection.Short, amountsOfShares, account);
      assert.ok(tx, 'invest should not be revert');
    }

    for (let i = 0; i < 5; i++) {
      const targetPrice = futureData.defaultTargetPrice * (0.85 + (0.3 * Math.random()));
      await future.setTargetPrice(targetPrice);
      await futureUtils.safeCheckPosition(future);
    }

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be zero');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);
    assert.equal((await web3.eth.getBalance(future.address)).toString(), 0, 'Future should be empty');
    assert.equal((await future.accumulatedFee()).toNumber(), 0, 'Accumulated fee should be withdrawn');

  });

  //  Stress test case 2:
  //  Investors invest in long with a random price between 0.9 and 1.1 ETH
  //  The same 20 investors invest long, and also short
  //  With random price between 0.85 and 1.15 ETH we check positions 5 times.
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0.
  it("Stress test case 2 ", async () => {

    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);

    await Promise.all(
      groupAll.map(
        async (account, index) => {
          const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
          await future.setTargetPrice(targetPrice);

          const txLong = await futureUtils.safeInvest(future, FutureDirection.Short, 2,
            account);
          assert.ok(txLong, 'invest should not be revert');
          const txShort = await futureUtils.safeInvest(future, FutureDirection.Short, 2,
            account);
          assert.ok(txShort, 'invest should not be revert');
        }
      )
    );

    for (let i = 0; i < 5; i++) {
      const targetPrice = futureData.defaultTargetPrice * (0.85 + (0.3 * Math.random()));
      await future.setTargetPrice(targetPrice);
      await futureUtils.safeCheckPosition(future);
    }

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);


  });

  //  Stress test case 3:
  //  Investors invest in long with 1 ETH. deposit percentage is 1% amounts per share is 1.
  //  1 investor invest Long but buy 100 tokens, same does investor short
  //  Price at 0.95 ETH, and check position til is finished
  //  Price at 1.05 ETH, and check position til is finished
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0,
  //  investor LONG gets all winner balance.

  it.only("Stress test case 3", async () => {


    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: 0.1,
      amountOfTargetPerShare: 2,
    });

    const investA = groupAll[0];
    const txLong = await futureUtils.safeInvest(future, FutureDirection.Long, 100, investA);
    const txShort = await futureUtils.safeInvest(future, FutureDirection.Short, 100, investA);

    // let targetPrice = futureData.defaultTargetPrice * 0.95;
    // await future.setTargetPrice(targetPrice);
    // await futureUtils.safeCheckPosition(future);
    // targetPrice = futureData.defaultTargetPrice * 1.05;
    // await future.setTargetPrice(targetPrice);
    // await futureUtils.safeCheckPosition(future);

    // const txClear = await futureUtils.safeClear(future);
    // assert.ok(txClear, 'clear should be success');

    // assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    // const accumulatedFee = (await future.accumulatedFee()).toNumber();
    // const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    // assert.ok(txGetManagerFee);

  });


  //  Stress test case 4:
  //  Investors invest in long and short from 0.99 to 1.01  ETH with a lot of decimals. deposit %  is 1% amounts per share is 1.
  //  1 investor invest Long but buy 10 tokens, same does investor short
  //  Price at really random decimal number between 0.92 and 0.96, and check position til is finished
  //  Price at really random decimal number between 1.02 and 1.06, and check position til is finished
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0, investor LONG gets all winner balance.

  it.skip("Stress test case 4", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 1,
    });


    let targetPrice = futureData.defaultTargetPrice * (0.92 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);
    targetPrice = futureData.defaultTargetPrice * (1.02 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });


  //  Stress test case 5:
  //  Investors invest in long with a 1 ETH. deposit %  is 1% amounts per share is 1.
  //  1 investor invest Long but buy 10 tokens, same does investor short
  //  Price at really random decimal number between 0.92 and 0.96, and check position til is finished
  //  Price at really random decimal number between 1.02 and 1.06, and check position til is finished
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0, investor LONG gets all winner balance.


  it.skip("Stress test case 5", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 1,
    });


    let targetPrice = futureData.defaultTargetPrice * (0.92 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);
    targetPrice = futureData.defaultTargetPrice * (1.02 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });

  //  Bot test case 1:
  //  Investors invest in long with a random price between 0.99 and 1.01 ETH. Long and Short buy 4 tokens each
  //  Change change position for each 1.5 second. Change step provider to execute 3 by 3 times.
  //  Set a timer to call check position like the bot.
  //  Set a timer to change the price randomly between 0.97 and and 1.03 with some more decimals
  //  Once 3 times check position is finish, execute clear position until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0.

  // check position then change price.

  it.skip("Bot test case 1", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 1,
    });


    let targetPrice = futureData.defaultTargetPrice * (0.92 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);
    targetPrice = futureData.defaultTargetPrice * (1.02 + (0.04 * Math.random()));
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });

});
