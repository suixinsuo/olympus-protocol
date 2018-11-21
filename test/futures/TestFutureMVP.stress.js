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
    assert(accounts.length >= 21, "Require at least 11 investors for this test case");
    providers = await futureUtils.setUpComponentList();
  });

  /**
   * Create Future
   */
  it("1. Created Future", async () => {
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
  it("2. Stress for 10 investor invest ", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);
    const amountsOfShares = 2;
    const investmentMargin = 1;

    let index = 0;
    while (index < groupA.length) {
      const account = groupA[index];
      const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
      await future.setTargetPrice(targetPrice);
      const tx = await futureUtils.safeInvest(future, FutureDirection.Long, amountsOfShares, account,
        investmentMargin);
      assert.ok(tx, 'invest A should not be reverted');
      index++;
    }

    index = 0;
    while (index < groupA.length) {
      const account = groupA[index];
      const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
      await future.setTargetPrice(targetPrice);
      const tx = await futureUtils.safeInvest(future, FutureDirection.Short, amountsOfShares, account);
      assert.ok(tx, 'invest A should not be reverted');
      index++;
    }

    index = 0;
    while (index < groupB.length) {
      const account = groupB[0];
      const targetPrice = futureData.defaultTargetPrice * (0.9 + (0.2 * Math.random()));
      await future.setTargetPrice(targetPrice);
      const tx = await futureUtils.safeInvest(future, FutureDirection.Short, amountsOfShares, account);
      assert.ok(tx, 'invest B should not be reverted');
      index++;
    }

    index = 0;
    while (index < 5) {
      const targetPrice = futureData.defaultTargetPrice * (0.85 + (0.3 * Math.random()));
      await future.setTargetPrice(targetPrice);
      await futureUtils.safeCheckPosition(future);
      index++;
    }

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be zero');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);
    assert.equal((await web3.eth.getBalance(future.address)).toString(), 0, 'Future should be empty'); // sometimes balance remain (800)
    assert.equal((await future.accumulatedFee()).toNumber(), 0, 'Accumulated fee should be withdrawn');

  });

  //  Stress test case 2:
  //  Investors invest in long with a random price between 0.9 and 1.1 ETH
  //  The same 20 investors invest long, and also short 2 ETH.
  //  With random price between 0.85 and 1.15 ETH we check positions 5 times.
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0.
  it("3. Investors invest in long with a random price", async () => {

    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);

    let index = 0;
    while (index < groupA.length) {
      const account = groupA[index];
      const randomRate = (0.9 + (0.2 * Math.random())); // 0.9 ~ 1.1
      const targetPrice = futureData.defaultTargetPrice * randomRate;
      await future.setTargetPrice(targetPrice);
      const investShares = 2;
      const txLong = await futureUtils.safeInvest(future, FutureDirection.Long, investShares,
        account);
      assert.ok(txLong, 'invest should not be reverted');
      const txShort = await futureUtils.safeInvest(future, FutureDirection.Short, investShares,
        account);
      assert.ok(txShort, 'invest should not be reverted');
      index++;
    }

    for (let i = 0; i < 5; i++) {
      const randomRate = (0.85 + (0.3 * Math.random())); // 0.8 ~ 1.15
      const targetPrice = futureData.defaultTargetPrice * randomRate;
      await future.setTargetPrice(targetPrice);
      await futureUtils.safeCheckPosition(future);
    }

    const txClear = await futureUtils.safeClear(future); // sometime can't not clear.
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });

  //  Stress test case 3:
  //  Investors invest in long with 1 ETH. deposit percentage is 1% amounts per share is 1.
  //  1 investor invest Long but buy 10 tokens, same does investor short
  //  Price at 0.95 ETH, and check position til is finished
  //  Price at 1.05 ETH, and check position til is finished
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0,
  //  investor LONG gets all winner balance.

  it("4. Investors invest in long with 1 ETH", async () => {

    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 2,
    });
    assert.equal((await future.status()).toNumber(), 1);

    const investA = groupAll[0];
    const investShares = 10;
    await futureUtils.safeInvest(future, FutureDirection.Long, investShares, investA);
    await futureUtils.safeInvest(future, FutureDirection.Short, investShares, investA);

    const groupAllInvestShares = 1;
    await Promise.all(
      groupAll.map(
        async (account, index) => {
          const txLong = await futureUtils.safeInvest(future, FutureDirection.Long, groupAllInvestShares,
            account);
          assert.ok(txLong, 'invest should not be reverted');
          const txShort = await futureUtils.safeInvest(future, FutureDirection.Short,
            groupAllInvestShares,
            account);
          assert.ok(txShort, 'invest should not be reverted');
        }
      )
    );

    let priceRate = 0.95;
    let targetPrice = futureData.defaultTargetPrice * priceRate;
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    priceRate = 1.05;
    targetPrice = futureData.defaultTargetPrice * priceRate;
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });


  //  Stress test case 4:
  //  Investors invest in long and short from 0.99 to 1.01  ETH with a lot of decimals. deposit is 1% amounts per share is 1.
  //  1 investor invest Long but buy 10 tokens, same does investor short
  //  Price at really random decimal number between 0.92 and 0.96, and check position til is finished
  //  Price at really random decimal number between 1.02 and 1.06, and check position til is finished
  //  Then we call clear until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0, investor LONG gets all winner balance.

  it("5. Investors invest in long and short from 0.99 to 1.01 ", async () => {
    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 1,
    });

    const investA = groupAll[0];
    await futureUtils.safeInvest(future, FutureDirection.Long, 10, investA);
    await futureUtils.safeInvest(future, FutureDirection.Short, 10, investA);

    let randomRate = (0.92 + (0.04 * Math.random()));
    let targetPrice = futureData.defaultTargetPrice * randomRate;
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    randomRate = (1.02 + (0.04 * Math.random()));
    targetPrice = futureData.defaultTargetPrice * randomRate;
    await future.setTargetPrice(targetPrice);
    await futureUtils.safeCheckPosition(future);

    const txClear = await futureUtils.safeClear(future);
    assert.ok(txClear, 'clear should be success');

    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const txGetManagerFee = await future.getManagerFee(accumulatedFee);
    assert.ok(txGetManagerFee);

  });

  //  Bot test case 6:
  //  Investors invest in long with a random price between 0.99 and 1.01 ETH. Long and Short buy 4 tokens each
  //  Change change position for each 1.5 second. Change step provider to execute 3 by 3 times.
  //  Set a timer to call check position like the bot.
  //  Set a timer to change the price randomly between 0.97 and and 1.03 with some more decimals
  //  Once 3 times check position is finish, execute clear position until is finish.
  //  Nothing reverts, when withdraw all management fee ETH balance is 0.
  // check position then change price.
  it("6. Investors invest in long with a random price", async () => {

    const {
      future,
      longToken,
      shortToken
    } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, {
      depositPercentage: futureUtils.DENOMINATOR * 0.01,
      amountOfTargetPerShare: 1,
    });

    const maxTimerDuration = 1000 * 120;
    const intervalSetPrice = setInterval(async () => {
      const randomRate = (0.9 + (0.2 * Math.random()));
      const targetPrice = futureData.defaultTargetPrice * randomRate;
      await future.setTargetPrice(targetPrice);
    }, 500);

    const intervalCheckPosition = setInterval(async () => {
      await futureUtils.safeCheckPosition(future);
    }, 500);

    setTimeout(async () => {
      clearInterval(intervalSetPrice);
      clearInterval(intervalCheckPosition);
      await futureUtils.safeCheckPosition(future);
      const txClear = await futureUtils.safeClear(future);
      assert.ok(txClear, 'clear should be success');

      assert(false, 'pause');
      assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance should be 0');
      const accumulatedFee = (await future.accumulatedFee()).toNumber();
      const txGetManagerFee = await future.getManagerFee(accumulatedFee);
      assert.ok(txGetManagerFee);
    }, maxTimerDuration);

    // We change the price randomly, so is possible between we calculate the amount of
    // investment require, then the price will change higher and we have no enough cash 
    // to purchase a token, so we add 25% more amount in that case
    const investmentMargin = 1.25;
    await Promise.all(
      groupAll.map(
        async (account, index) => {
          const investLongShares = 1;
          const investShortShares = 4;
          const txLong = await futureUtils.safeInvest(future, FutureDirection.Long, investLongShares,
            account, investmentMargin);
          assert.ok(txLong, 'invest should not be reverted');
          const txShort = await futureUtils.safeInvest(future, FutureDirection.Short, investShortShares,
            account, investmentMargin);
          assert.ok(txShort, 'invest should not be reverted');
        }
      )
    );
  });

});
