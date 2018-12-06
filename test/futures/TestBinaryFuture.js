const calc = require('../utils/calc');
const BigNumber = web3.BigNumber;

const { FutureDirection, DerivativeType } = require('../utils/constants');
const futureUtils = require('./futureUtils');
const futureData = futureUtils.binaryFutureData;
const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');
const DENOMINATOR = 10000;
const BinaryFuture = artifacts.require('BinaryFutureStub');


// FUNCTIONS: Refactor them when created new binary special scenarios
const investBinarySeveral = async (future, investors, period, direction, totaInvestment, weights) => {
  for (let i = 0; i < investors.length; i++) {
    await future.invest(direction, period,
      { from: investors[i], value: totaInvestment.mul(weights[i]) }
    );
  }
}

const getClearData = async (future, period) => {
  const winnersBalance = await future.winnersBalances(period);
  const winnersInvestment = await future.winnersInvestment(period);
  const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(period);
  const clearFinish = await future.tokensCleared(period);
  return { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish };

}

const checkTokensInvalid = async (binaryToken, period) => {
  const longInvestedTokens = await binaryToken.getTokensByPeriod(period);
  for (let i = 0; i < longInvestedTokens.length; i++) {
    assert.notOk(await binaryToken.isTokenValid(longInvestedTokens[i]))
  }
}

const checkLosersRedeemBalance = async (future, losers) => {
  for (let i = 0; i < losers.length; i++) {
    const redeemBalance = await future.userRedeemBalance(losers[i]);
    assert(redeemBalance.eq(0), `Investor ${i} has nothing to rebalance`)
  }
}
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
  let accumulatedFee = 0;

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

    await future.initialize(providers.componentList.address,futureData.feePercentage);
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
      await future.initialize(providers.componentList.address,futureData.feePercentage)
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
  // In clear we will fix the period, to make sure all the number matches. Each clear test is
  // independent of the previus test and among each other

  it("Can't clear scenarios", async () => {
    const testPeriod = 10000;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    // Invest
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);

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


    // Normal clear - No winners, deposit is returned
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);

    // Cant clear twice
    await calc.assertReverts(async () => {
      await future.clear(testPeriod, { from: investorsLong[0] });
    }, "Can't clear twice");


    // Check Redeem
    for (let i = 0; i < investorsLong.length; i++) {
      const redeemBalance = await future.userRedeemBalance(investorsLong[i]);
      assert(redeemBalance.eq(totalLongInvestment.mul(weights[i])), `Investor long ${i} redeem balance is correct`);

      await future.redeem({ from: investorsLong[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investorsLong[i]);
      assert(redeemBalanceAfter.eq(0), `Investor long ${i} redeemed his balance`)
    }

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Special scenarios, no losers', async () => {
    const testPeriod = 10001;
    await future.setMockPeriod(testPeriod); // Make sure is stable during the test

    // Invest
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);
    await investBinarySeveral(future, investorsShort, testPeriod, FutureDirection.Short, totalShortInvestment, weights);

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
    for (let i = 0; i < investors.length; i++) {

      const weightIndex = i < investorsLong.length ? i : i - investorsLong.length;
      const initialInvestment = i < investorsLong.length ? totalLongInvestment : totalShortInvestment;
      // All the investors
      const deposit = initialInvestment.mul(weights[weightIndex]);

      assert.equal(depositReturned[i].args._holder, investors[i]);
      assert(depositReturned[i].args._period.eq(testPeriod));
      assert(depositReturned[i].args._amount.eq(deposit));
    }
    // Check
    const { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish } = await getClearData(future, testPeriod);
    assert(winnersBalance.eq(0), 'Winners balance is 0');
    assert(winnersInvestment.eq(0), 'Winners investment 0');
    assert(winnersBalanceRedeemed.eq(0), 'Winners redeem is 0');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    await checkTokensInvalid(longToken, testPeriod);
    await checkTokensInvalid(shortToken, testPeriod);


    // ALL 6 investors get returned the deposit
    for (let i = 0; i < investors.length; i++) {

      const weightIndex = i < investorsLong.length ? i : i - investorsLong.length;
      const initialInvestment = i < investorsLong.length ? totalLongInvestment : totalShortInvestment;
      const redeemBalance = await future.userRedeemBalance(investors[i]);

      assert(redeemBalance.eq(initialInvestment.mul(weights[weightIndex])), `Investor ${i} redeem balance is correct`);

      await future.redeem({ from: investors[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investors[i]);
      assert(redeemBalanceAfter.eq(0), `Investor ${i} redeemed his balance`)
    }
    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Clear long win With FEE', async () => {
    const testPeriod = 10002;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);
    await investBinarySeveral(future, investorsShort, testPeriod, FutureDirection.Short, totalShortInvestment, weights);

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
        .sub(await futureUtils.getRewardAmountForBinaryFuture(future, totalShortInvestment)).mul(0.99) // FEE is 1%
        .mul(weights[i]);

      assert.equal(events[i].args._holder, investorsLong[i]);
      assert(events[i].args._period.eq(testPeriod));
      assert(events[i].args._amount.eq(deposit.add(benefits)));
    }
    // Check
    const { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish } = await getClearData(future, testPeriod);

    const reward = await futureUtils.getRewardAmountForBinaryFuture(future, totalShortInvestment);
    assert(winnersBalance.eq((totalShortInvestment.sub(reward))), 'Winners balance is correct');
    assert(winnersInvestment.eq(totalLongInvestment), 'Winners investment is correct');
    assert(winnersBalanceRedeemed.eq(winnersBalance * 0.99), 'Winners redeem all benefits');
    const futurefee = await future.accumulatedFee();
     
    accumulatedFee = accumulatedFee + futurefee;
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    await checkTokensInvalid(longToken, testPeriod);
    await checkTokensInvalid(shortToken, testPeriod);


    // Check Redeem Winners
    for (let i = 0; i < investorsLong.length; i++) {
      const redeemBalance = await future.userRedeemBalance(investorsLong[i]);
      const benefits = totalShortInvestment.sub(reward).mul(weights[i]).mul(0.99) ; //FEE is 1%
      const deposit = totalLongInvestment.mul(weights[i]);
      assert(redeemBalance.eq(benefits.add(deposit)), `Investor long ${i} redeem balance is correct`);

      await future.redeem({ from: investorsLong[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investorsLong[i]);
      assert(redeemBalanceAfter.eq(0), `Investor long ${i} redeemed his balance`)
    }
    // Check Redeem Loosers
    await checkLosersRedeemBalance(future, investorsShort);
    // Reset
    await future.withdrawFee(futurefee);
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  it('Clear short win with FEE ', async () => {
    const testPeriod = 10003;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.

    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);
    await investBinarySeveral(future, investorsShort, testPeriod, FutureDirection.Short, totalShortInvestment, weights);


    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(0.9));

    // Clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, investorsLong.length, 'One event per winner');
    // Check values are correct

    const reward = await futureUtils.getRewardAmountForBinaryFuture(future, totalLongInvestment);
    for (let i = 0; i < events.length; i++) {
      const deposit = totalShortInvestment.mul(weights[i]);
      const benefits = totalLongInvestment.sub(reward).mul(weights[i]).mul(0.99); // FEE is 1%;

      assert.equal(events[i].args._holder, investorsShort[i]);
      assert(events[i].args._period.eq(testPeriod));
      assert(events[i].args._amount.eq(deposit.add(benefits)));
    }
    // Check
    const { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish } = await getClearData(future, testPeriod);

    assert(winnersBalance.add(reward).eq(totalLongInvestment), 'Winners balance is correct');
    assert(winnersInvestment.eq(totalShortInvestment), 'Winners investment is correct');
    assert(winnersBalanceRedeemed.eq(winnersBalance * 0.99), 'Winners redeem all benefits');

    const futurefee = await future.accumulatedFee();
    assert.equal(futurefee,winnersBalance * 0.01); //Check FEE
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    await checkTokensInvalid(longToken, testPeriod);
    await checkTokensInvalid(shortToken, testPeriod);


    // Check Redeem Winners
    for (let i = 0; i < investorsShort.length; i++) {
      const redeemBalance = await future.userRedeemBalance(investorsShort[i]);
      const benefits = totalLongInvestment.sub(reward).mul(weights[i]).mul(0.99);
      const deposit = totalShortInvestment.mul(weights[i]);

      assert(redeemBalance.eq(benefits.add(deposit)), `Investor short ${i} redeem balance is correct`);

      await future.redeem({ from: investorsShort[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investorsShort[i]);
      assert(redeemBalanceAfter.eq(0), `Investor short ${i} redeemed his balance`)
    }
    // Check Redeem Losers
    checkLosersRedeemBalance(future, investorsLong);

    // Reset
    await future.withdrawFee(futurefee);
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });


  it("Special scenarios, all losers", async () => {
    const testPeriod = 10004;
    await future.setMockPeriod(testPeriod); // Make sure is estable during the test

    // Only invest long, and lose
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);

    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(0.9));

    // Clear
    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, 0, 'no winners');

    // Check
    const { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish } = await getClearData(future, testPeriod);
    const reward = await futureUtils.getRewardAmountForBinaryFuture(future, totalLongInvestment);

    assert(winnersBalance.eq(totalLongInvestment.sub(reward)), 'Winners balance is correct');
    assert(winnersInvestment.eq(0), 'No winners (invest)');
    assert(winnersBalanceRedeemed.eq(0), 'No winners (redeem)');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    await checkTokensInvalid(longToken, testPeriod);
    await checkLosersRedeemBalance(future, investorsLong);

    // Special case
    const balanceLost = await future.futureOwnBalance();
    assert(balanceLost.eq(winnersBalance), 'Winner balance is lost');

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  });

  // --------------------------------------------------------------------------
  it('Clear long win ', async () => {
    const testPeriod = 10005;
    await future.setMockPeriod(testPeriod);
    await future.setManagementFee(0);

    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const totalShortInvestment = new BigNumber(web3.toWei(2, 'ether'));

    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.
    await investBinarySeveral(future, investorsLong, testPeriod, FutureDirection.Long, totalLongInvestment, weights);
    await investBinarySeveral(future, investorsShort, testPeriod, FutureDirection.Short, totalShortInvestment, weights);
    // Mock price to make long investors win
    await future.setMockPeriod(testPeriod + 2); // Increase the period so we can clear
    await future.setMockTargetPrice(new BigNumber(futureData.defaultTargetPrice).mul(1.1));

    const tx = await future.clear(testPeriod, { from: investorsLong[0] });
    assert.ok(tx);
    const events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, investorsLong.length, 'One event per winner');

    for (let i = 0; i < events.length; i++) {
      const deposit = totalLongInvestment.mul(weights[i]);
      const benefits = totalShortInvestment
        .sub(await futureUtils.getRewardAmountForBinaryFuture(future, totalShortInvestment)).mul(1) // FEE is 0%
        .mul(weights[i]);

      assert.equal(events[i].args._holder, investorsLong[i]);
      assert(events[i].args._period.eq(testPeriod));
      assert(events[i].args._amount.eq(deposit.add(benefits)));
    }

        // Check
    const { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish } = await getClearData(future, testPeriod);

    const reward = await futureUtils.getRewardAmountForBinaryFuture(future, totalShortInvestment);
    assert(winnersBalance.eq((totalShortInvestment.sub(reward))), 'Winners balance is correct');
    assert(winnersInvestment.eq(totalLongInvestment), 'Winners investment is correct');
    assert(winnersBalanceRedeemed.eq(winnersBalance * 1), 'Winners redeem all benefits');
    assert(clearFinish, 'Period mark as clear completed');

    // Check tokens id
    await checkTokensInvalid(longToken, testPeriod);
    await checkTokensInvalid(shortToken, testPeriod);


    // Check Redeem Winners
    for (let i = 0; i < investorsLong.length; i++) {
      const redeemBalance = await future.userRedeemBalance(investorsLong[i]);
      const benefits = totalShortInvestment.sub(reward).mul(weights[i]).mul(1) ; //FEE is 0%
      const deposit = totalLongInvestment.mul(weights[i]);
      assert(redeemBalance.eq(benefits.add(deposit)), `Investor long ${i} redeem balance is correct`);

      await future.redeem({ from: investorsLong[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investorsLong[i]);
      assert(redeemBalanceAfter.eq(0), `Investor long ${i} redeemed his balance`)
    }
    // Check Redeem Loosers
    await checkLosersRedeemBalance(future, investorsShort);
    
    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);
  })


  // ----------------------------- REDEEM TEST  -------------------------------
  // Some redeem logic not tested on the clear scenarios
  it("Redeems accumulates between clears", async () => {
    const testPeriodA = 10007;
    const testPeriodB = 10008;

    // Only invest long, and lose
    const totalLongInvestment = new BigNumber(web3.toWei(1, 'ether'));
    const weights = [0.2, 0.35, 0.45]; // Investor 1 will invest 20% of 1 ETH, etc.

    // Invest in periodA
    await future.setMockPeriod(testPeriodA); // Make sure is estable during the test
    await investBinarySeveral(future, investorsLong, testPeriodA, FutureDirection.Long, totalLongInvestment, weights);
    // Invest in periodB
    await future.setMockPeriod(testPeriodB); // Make sure is estable during the test
    await investBinarySeveral(future, investorsLong, testPeriodB, FutureDirection.Long, totalLongInvestment, weights);

    // We will get deposit return
    // Clear periodA
    await future.setMockPeriod(testPeriodA + 2); // Increase the period so we can clear
    await future.clear(testPeriodA, { from: investorsLong[0] });
    // Clear periodB
    await future.setMockPeriod(testPeriodB + 2); // Increase the period so we can clear
    await future.clear(testPeriodB, { from: investorsLong[0] });


    // Redeem accumulated fee
    for (let i = 0; i < investorsLong.length; i++) {
      const deposit = totalLongInvestment.mul(weights[i]).mul(2); // We have invested in two periods
      const redeemBalance = await future.userRedeemBalance(investorsLong[i]);

      assert(redeemBalance.eq(deposit), `Investor long ${i} redeem balance is correct`);

      await future.redeem({ from: investorsLong[i] });

      const redeemBalanceAfter = await future.userRedeemBalance(investorsLong[i]);
      assert(redeemBalanceAfter.eq(0), `Investor long ${i} redeemed all his balance`)
    }

    // Assert redeem with no balance will revert
    await calc.assertReverts(async () => {
      await future.redeem({ from: investorsLong[0] });
    }, "Cant redeem with no pending balance");

    // Reset
    await future.setMockPeriod(futureData.disabledValue);
    await future.setMockTargetPrice(futureData.disabledValue);

  });
  // --------------------------------------------------------------------------

});
