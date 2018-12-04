const calc = require('../utils/calc');
const BigNumber = web3.BigNumber;

const { FutureDirection, DerivativeType } = require('../utils/constants');
const futureUtils = require('./futureUtils');
const futureData = futureUtils.binaryFutureData;
const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');

const BinaryFuture = artifacts.require('BinaryFutureStub');

/**
 *   ================= BASIC FLOW =================
 *   This test is creating a single future with heavily dependency among the test.
 *   Once the future has been closed can't continue testing.
 *    1. Separate by sections of what are you testing, document what are the preconditions expected.
 *    2. Reset all global settings at the end of each test or section.
 */

contract('Test Binary Future', accounts => {
  let future;
  let providers;

  const investorA = accounts[1];
  const investorB = accounts[2];
  // Groups of investors
  const investorsLong = accounts.slice(1, 4);
  const investorsShort = accounts.slice(4, 7);

  let longToken;
  let shortToken;
  before('Initialize ComponentList', async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  // Set the timer to 0
  it('Create a future', async () => {
    future = await BinaryFuture.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      providers.tokens[0], // A token from Kyber
      futureData.investingPeriod,
    );

    assert.equal((await future.status()).toNumber(), 0); // new

    await future.initialize(providers.componentList.address);
    const myProducts = await providers.market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], future.address);
    assert.equal((await future.status()).toNumber(), 1); // Active

    // We have created two new ERC721, check the address is not 0
    const longAddress = await future.getLongToken();
    const shortAddress = await future.getShortToken();

    assert.ok(parseInt(longAddress) != 0, 'Long token is set');
    assert.ok(parseInt(shortAddress) != 0, 'Short token is set');

    longToken = new BinaryFutureToken(longAddress);
    shortToken = new BinaryFutureToken(shortAddress);

    assert.equal(await longToken.owner(), future.address);
    assert.equal((await longToken.tokenPosition()).toNumber(), FutureDirection.Long, 'Long token is long');

    assert.equal(await shortToken.owner(), future.address);
    assert.equal((await shortToken.tokenPosition()).toNumber(), FutureDirection.Short, 'Short token is short');
  });

  // --------------------------------------------------------------------------
  // ----------------------------- CONFIG TEST  -------------------------------
  it('Cant call initialize twice ', async () => {
    await calc.assertReverts(async () => {
      await future.initialize(providers.componentList.address, futureData.clearInterval);
    }, 'Shall revert');
  });

  it('Future initialized correctly', async () => {
    assert.equal(await future.name(), futureData.name);
    assert.equal(await future.description(), futureData.description);
    assert.equal(await future.symbol(), futureData.symbol);
    assert.equal(calc.bytes32ToString(await future.category()), futureData.category);
    assert((await future.version()) !== '');
    assert.equal(await future.getTargetAddress(), providers.tokens[0]);
    assert.equal(await future.fundType(), DerivativeType.Future);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- Invest TEST  -------------------------------

  it("Can't invest while is not active ", async () => {
    // future is already activate, create new future for this scenario
    const notActiveFuture = await BinaryFuture.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      providers.tokens[0], // A token from Kyber
      futureData.investingPeriod,
    );

    const depositValue = web3.toWei(1, 'ether');
    const period = await future.getCurrentPeriod();
    await calc.assertReverts(async () => {
      await notActiveFuture.invest(FutureDirection.Long, period, { from: investorA, value: depositValue });
    }, 'Shall revert if the future is not Active');
  });

  it('Get price from kyber', async () => {
    assert((await future.getTargetPrice()).eq(futureData.defaultTargetPrice));
  });

  it('Can invest if target price is broken', async () => {
    // Broke the future
    await future.setMockTargetPrice(0);
    // Invest
    const depositValue = web3.toWei(1, 'ether');
    const period = await future.getCurrentPeriod();

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, period, { from: investorA, value: depositValue });
    }, 'Shall revert because target price is broken');
    // Reset the future
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Assert Period', async () => {
    const time1 = 10;
    const period1 = await future.getPeriod(time1);
    assert.equal(period1, Math.floor(time1 / futureData.investingPeriod));

    const time2 = 15;
    const period2 = await future.getPeriod(time2);
    assert.equal(period2, Math.floor(time2 / futureData.investingPeriod));

    const time3 = 514522584;
    const period3 = await future.getPeriod(time3);
    assert.equal(period3, Math.floor(time3 / futureData.investingPeriod));
  });

  it('Invest long', async () => {
    const depositValue = new BigNumber(web3.toWei(1, 'ether'));
    const depositValue2 = new BigNumber(web3.toWei(1, 'ether'));
    let tokensA;
    const period = await future.getCurrentPeriod();
    await future.setMockPeriod(period);

    let tx;
    tx = await future.invest(FutureDirection.Long, period, { from: investorA, value: depositValue });
    assert.ok(tx);

    // Invest first time
    tokensA = await longToken.getTokenIdsByOwner(investorA);
    assert.equal(tokensA.length, 1);
    assert.equal(await longToken.isTokenValid(tokensA[0]), true, 'Token A is valid');

    assert((await longToken.getDeposit(tokensA[0])).eq(depositValue), 'Token A deposit is correct');
    assert((await longToken.getTokenPeriod(tokensA[0])).eq(period), 'Token A deposit is correct');
    assert((await longToken.getBuyingPrice(tokensA[0])).eq(1), 'Binary dont store buying Price');

    // Invest second time increase investment
    tx = await future.invest(FutureDirection.Long, period, { from: investorA, value: depositValue2 });
    assert.ok(tx);

    tokensA = await longToken.getTokenIdsByOwner(investorA);
    assert.equal(tokensA.length, 1, 'Investor A increase his own long token');
    assert(
      (await longToken.getDeposit(tokensA[0])).eq(depositValue.add(depositValue2)),
      'Token A deposit is increased',
    );

    // Try to invest in the wrong period
    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, period + 10, { from: investorA, value: depositValue });
    }, 'Shall revert if the period is wrong');
    // Reset
    await future.setMockPeriod(futureData.disabledValue);
  });

  it('Invest Short', async () => {
    // Kind of duplicated of long token, but with short. Just for peace of mind, more or less test the same
    const depositValue = new BigNumber(web3.toWei(1, 'ether'));
    const depositValue2 = new BigNumber(web3.toWei(1, 'ether'));
    let tokensA;
    const period = await future.getCurrentPeriod();
    await future.setMockPeriod(period);

    let tx;
    tx = await future.invest(FutureDirection.Short, period, { from: investorA, value: depositValue });
    assert.ok(tx);

    // Invest first time
    tokensA = await shortToken.getTokenIdsByOwner(investorA);
    assert.equal(tokensA.length, 1);
    assert.equal(await shortToken.isTokenValid(tokensA[0]), true, 'Token A is valid');

    assert((await shortToken.getDeposit(tokensA[0])).eq(depositValue), 'Token A deposit is correct');
    assert((await shortToken.getTokenPeriod(tokensA[0])).eq(period), 'Token A deposit is correct');
    assert((await shortToken.getBuyingPrice(tokensA[0])).eq(1), 'Binary dont store buying Price');

    // Invest second time increase investment
    tx = await future.invest(FutureDirection.Short, period, { from: investorA, value: depositValue2 });
    assert.ok(tx);

    tokensA = await shortToken.getTokenIdsByOwner(investorA);
    assert.equal(tokensA.length, 1, 'Investor A increase his own long token');
    assert(
      (await shortToken.getDeposit(tokensA[0])).eq(depositValue.add(depositValue2)),
      'Token A deposit is increased',
    );

    // Try to invest in the wrong period
    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Short, period + 10, { from: investorA, value: depositValue });
    }, 'Shall revert if the period is wrong');

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
  });

  it('Price remain from the last investment', async () => {
    const defaultPrice = new BigNumber(futureData.defaultTargetPrice);
    const manualIncrease = new BigNumber(0.1); // 10%
    const investTimes = 3;
    const period = await future.getCurrentPeriod();
    await future.setMockPeriod(period); // Make sure is estable during the test

    const depositValue = new BigNumber(web3.toWei(0.2, 'ether'));

    for (let i = 0; i < investTimes; i++) {
      // Increase 10, 20, 30%... each time
      await future.setMockTargetPrice(defaultPrice.mul(manualIncrease.mul(i + 1)));
      await future.invest(FutureDirection.Long, period, { from: investorA, value: depositValue });
    }

    const lastPrice = await future.prices(period);
    assert(lastPrice.eq(defaultPrice.mul(manualIncrease.mul(investTimes))));
    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Invest two different times in two differen tokens', async () => {
    const depositValue = new BigNumber(web3.toWei(1, 'ether'));

    const period = 10; // Just period id, no special meaning
    await future.setMockPeriod(period);

    // Invest in two periods
    await future.invest(FutureDirection.Long, period, { from: investorB, value: depositValue });
    await future.setMockPeriod(period + 1);
    await future.invest(FutureDirection.Long, period + 1, { from: investorB, value: depositValue });

    let tokensB = await longToken.getTokenIdsByOwner(investorB);

    assert.equal(tokensB.length, 2, 'Investor A increase his own long token');

    assert((await longToken.getTokenPeriod(tokensB[0])).eq(period), 'Token A deposit is correct');
    assert((await longToken.getTokenPeriod(tokensB[1])).eq(period + 1), 'Token A deposit is correct');

    await future.setMockPeriod(futureData.disabledValue);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- CLEAR TEST  -------------------------------
  // In clear we will fix the period, to make sure all the number matches
  it("Can't clear scenarios", async () => {
    const testPeriod = 10000;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    // Invest
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    for (let i = 0; i < investorsLong.length; i++) {
      await future.invest(FutureDirection.Long, testPeriod, {
        from: investorsLong[i],
        value: totalLongInvestment.mul(weights[i]),
      });
    }

    // Period not ready to clear
    await calc.assertReverts(async () => {
      await future.clear(testPeriod, { from: investorsLong[0] });
    }, "Can't clear in the current period");

    // Prices is broken
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(0);

    await calc.assertReverts(async () => {
      await future.clear(testPeriod, { from: investorsLong[0] });
    }, "Can't clear with broken price");

    // Is not owner of token
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice));

    await calc.assertReverts(async () => {
      await future.clear(testPeriod, { from: accounts[0] }); // The owner hasnt invest, cant clear
    }, "Can't clear if doesn't hold a token");

    // Normal clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);

    // Cant clear twice
    await calc.assertReverts(async () => {
      await future.clear(testPeriod, { from: investorsLong[0] });
    }, "Can't clear twice");

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Special scenarios, no losers', async () => {
    const testPeriod = 10001;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    // Invest
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    for (let i = 0; i < investorsLong.length; i++) {
      await future.invest(FutureDirection.Long, testPeriod, {
        from: investorsLong[i],
        value: totalLongInvestment.mul(weights[i]),
      });
    }

    for (let i = 0; i < investorsShort.length; i++) {
      await future.invest(FutureDirection.Short, testPeriod, {
        from: investorsShort[i],
        value: totalShortInvestment.mul(weights[i]),
      });
    }

    // Clear
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice));

    // Normal clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);

    // Events
    const benefitsEvents = calc.getEvent(tx, 'Benefits');
    assert.equal(benefitsEvents.length, 0, 'No winners');
    const depositReturned = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositReturned.length, 6, 'No winners');
    // Long first, as per contract order
    const investors = investorsLong.concat(investorsShort);
    // ALL 6 investors get returned the deposit
    for (let i = 0; i < depositReturned.length; i++) {
      const weightIndex = i < investorsLong.length ? i : i - investorsLong.length;
      const initialInvestment = i < investorsLong.length ? totalLongInvestment : totalShortInvestment;
      // All the investors
      const deposit = initialInvestment.mul(weights[weightIndex]);

      assert.equal(depositReturned[i].args._holder, investors[i]);
      assert(depositReturned[i].args._period.eq(testPeriod));
      assert(depositReturned[i].args._amount.eq(deposit));
    }
    // Check
    const winnersBalance = await future.winnersBalances(testPeriod);
    const winnersInvestment = await future.winnersInvestment(testPeriod);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(testPeriod);
    const clearFinish = await future.tokensCleared(testPeriod);

    assert(winnersBalance.eq(0), 'Winners balance is 0');
    assert(winnersInvestment.eq(0), 'Winners investment 0');
    assert(winnersBalanceRedeemed.eq(0), 'Winners redeem is 0');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    const longInvestedTokens = await longToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < longInvestedTokens.length; i++) {
      assert.notOk(await longToken.isTokenValid(longInvestedTokens[i]));
    }

    const shortInvestedTokens = await shortToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < shortInvestedTokens.length; i++) {
      assert.notOk(await shortToken.isTokenValid(longInvestedTokens[i]));
    }

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Clear long win', async () => {
    const testPeriod = 10002;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    for (let i = 0; i < investorsLong.length; i++) {
      await future.invest(FutureDirection.Long, testPeriod, {
        from: investorsLong[i],
        value: totalLongInvestment.mul(weights[i]),
      });
    }

    for (let i = 0; i < investorsShort.length; i++) {
      await future.invest(FutureDirection.Short, testPeriod, {
        from: investorsShort[i],
        value: totalShortInvestment.mul(weights[i]),
      });
    }

    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(1.1));

    // Clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, investorsLong.length, 'One event per winner');
    // Check values are correct
    for (let i = 0; i < events.length; i++) {
      const deposit = totalLongInvestment.mul(weights[i]);
      const benefits = totalShortInvestment
        .sub(await calc.getRewardAmountForBinaryFuture(future, totalShortInvestment))
        .mul(weights[i]);

      assert.equal(events[i].args._holder, investorsLong[i]);
      assert(events[i].args._period.eq(testPeriod));
      assert(events[i].args._amount.eq(deposit.add(benefits)));
    }
    // Check
    const winnersBalance = await future.winnersBalances(testPeriod);
    const winnersInvestment = await future.winnersInvestment(testPeriod);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(testPeriod);
    const clearFinish = await future.tokensCleared(testPeriod);

    const reward = await calc.getRewardAmountForBinaryFuture(future, totalShortInvestment);

    assert(winnersBalance.eq(totalShortInvestment.sub(reward)), 'Winners balance is correct');
    assert(winnersInvestment.eq(totalLongInvestment), 'Winners investment is correct');
    assert(winnersBalanceRedeemed.eq(winnersBalance), 'Winners redeem all benefits');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    const longInvestedTokens = await longToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < longInvestedTokens.length; i++) {
      assert.notOk(await longToken.isTokenValid(longInvestedTokens[i]));
    }

    const shortInvestedTokens = await shortToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < shortInvestedTokens.length; i++) {
      assert.notOk(await shortToken.isTokenValid(longInvestedTokens[i]));
    }

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Clear short win', async () => {
    const testPeriod = 10003;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    for (let i = 0; i < investorsLong.length; i++) {
      await future.invest(FutureDirection.Long, testPeriod, {
        from: investorsLong[i],
        value: totalLongInvestment.mul(weights[i]),
      });
    }

    for (let i = 0; i < investorsShort.length; i++) {
      await future.invest(FutureDirection.Short, testPeriod, {
        from: investorsShort[i],
        value: totalShortInvestment.mul(weights[i]),
      });
    }

    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(0.9));

    // Clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, investorsLong.length, 'One event per winner');
    // Check values are correct

    const reward = await calc.getRewardAmountForBinaryFuture(future, totalLongInvestment);
    for (let i = 0; i < events.length; i++) {
      const deposit = totalShortInvestment.mul(weights[i]);
      const benefits = totalLongInvestment.sub(reward).mul(weights[i]);

      assert.equal(events[i].args._holder, investorsShort[i]);
      assert(events[i].args._period.eq(testPeriod));
      assert(events[i].args._amount.eq(deposit.add(benefits)));
    }
    // Check
    const winnersBalance = await future.winnersBalances(testPeriod);
    const winnersInvestment = await future.winnersInvestment(testPeriod);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(testPeriod);
    const clearFinish = await future.tokensCleared(testPeriod);

    assert(winnersBalance.add(reward).eq(totalLongInvestment), 'Winners balance is correct');
    assert(winnersInvestment.eq(totalShortInvestment), 'Winners investment is correct');
    assert(winnersBalanceRedeemed.eq(winnersBalance), 'Winners redeem all benefits');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    const longInvestedTokens = await longToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < longInvestedTokens.length; i++) {
      assert.notOk(await longToken.isTokenValid(longInvestedTokens[i]));
    }

    const shortInvestedTokens = await shortToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < shortInvestedTokens.length; i++) {
      assert.notOk(await shortToken.isTokenValid(longInvestedTokens[i]));
    }

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Special scenarios, all loosers', async () => {
    const testPeriod = 10004;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    // Only invest long, and lose
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    for (let i = 0; i < investorsLong.length; i++) {
      await future.invest(FutureDirection.Long, testPeriod, {
        from: investorsLong[i],
        value: totalLongInvestment.mul(weights[i]),
      });
    }

    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(0.9));

    // Clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, 0, 'no winners');

    // Check
    const winnersBalance = await future.winnersBalances(testPeriod);
    const winnersInvestment = await future.winnersInvestment(testPeriod);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(testPeriod);
    const clearFinish = await future.tokensCleared(testPeriod);
    const reward = await calc.getRewardAmountForBinaryFuture(future, totalLongInvestment);

    assert(winnersBalance.eq(totalLongInvestment.sub(reward)), 'Winners balance is correct');
    assert(winnersInvestment.eq(0), 'No winners (invest)');
    assert(winnersBalanceRedeemed.eq(0), 'No winners (redeem)');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    const longInvestedTokens = await longToken.getTokensByPeriod(testPeriod);
    for (let i = 0; i < longInvestedTokens.length; i++) {
      assert.notOk(await longToken.isTokenValid(longInvestedTokens[i]));
    }

    // Special case
    const balanceLost = await future.futureOwnBalance();
    assert(balanceLost.eq(winnersBalance), 'Winner balance is lost');

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  // --------------------------------------------------------------------------

  // Cant clear twice, cant clear a future/present future
  // Cant clear if doesnt hold a token, cant clear token broken
  // Invest more than max investors
  // No winners, no losers
  // Check normal clear:
  //   Winnerbalance is all the losers balance
  //   winners redeemed is same as winner balance
  //   winnersInvestment is equal to winners investment
  //   all tokens get invalidated
  //   benefits events are emitted
});
