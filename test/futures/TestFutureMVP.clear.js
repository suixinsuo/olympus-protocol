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

contract("Test Future MVP Clear special cases", accounts => {

  let providers;

  const investorA = accounts[1];
  const investorB = accounts[2];
  const investorC = accounts[3];

  let longToken; // FutureERC721Token
  let shortToken; // FutureERC721Token

  before("Initialize ComponentList", async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  it("Create a future", async () => {
    const { future, longToken, shortToken } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address);

    assert.equal((await future.status()).toNumber(), 1); // Active

    assert.equal(await longToken.owner(), future.address);
    assert.equal((await longToken.tokenPosition()).toNumber(), FutureDirection.Long, 'Long token is long');

    assert.equal(await shortToken.owner(), future.address);
    assert.equal((await shortToken.tokenPosition()).toNumber(), FutureDirection.Short, 'Short token is short');

  });

  // ----------------------------- CLEAR SPECIAL CASES ----------------------
  // Eveytime we clear we close the future, so we need to create new future each scenario
  it("Shall clear with no valid tokens at the end", async () => {
    const { future, longToken, shortToken } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, { clearInterval: 0 });
    let tx;
    let events;
    let updatedPrice;

    // Long and short invest with default price
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 2, investorA);
    tx = await futureUtils.safeInvest(future, FutureDirection.Short, 2, investorB);

    assert.equal((await futureUtils.validTokens(longToken)).length, 2, ' 2 tokens for long');
    assert.equal((await futureUtils.validTokens(shortToken)).length, 2, ' 2 tokens for short');

    // --- We Make SHORT be out
    updatedPrice = 0.85 * futureData.defaultTargetPrice;
    await future.setTargetPrice(updatedPrice);
    await future.checkPosition();

    // --- We Make LONG be out
    updatedPrice = 1.15 * futureData.defaultTargetPrice;
    await future.setTargetPrice(updatedPrice);
    await future.checkPosition();

    assert.equal((await futureUtils.validTokens(longToken)).length, 0, ' All long tokens are invalid');
    assert.equal((await futureUtils.validTokens(shortToken)).length, 0, ' All short tokens are invalid');


    const winnersBalance = (await future.winnersBalance()).toNumber();

    // Clear
    await future.setTargetPrice(futureData.defaultTargetPrice);
    assert.ok(await future.clear.call(), 'Call returns true at once because there is no tokens');

    await future.clear();

    // Is properly closed
    assert.equal((await future.status()).toNumber(), DerivativeStatus.Closed, 'Future is closed');
    assert.equal((await future.frozenTotalWinnersSupply()).toNumber(), 0, 'Winners Supply reset');
    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance reset');
    assert.equal((await future.frozenPrice()).toNumber(), 0, 'frozen price reset');

    const managerFeeAfter = await future.accumulatedFee(); // BigNumber

    // All winnersBalance went to the owner
    // Shall winners balance + whatever is left from manager fee after clear.

    assert(managerFeeAfter.gt(winnersBalance), 'Winner balance went to manager Fee')
    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
  });

  it("Shall clear no winners no losers", async () => {
    const { future } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, { clearInterval: 0 });
    let tx;
    let deposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice);
    let events;

    // Both investor A and investor B has 1 long 1 short.
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 1, investorA);
    tx = await futureUtils.safeInvest(future, FutureDirection.Short, 1, investorA);
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 1, investorB);
    tx = await futureUtils.safeInvest(future, FutureDirection.Short, 1, investorB);

    // Clear 1 Long
    assert.notOk(await future.clear.call(), 'First will clear LONG');
    tx = await future.clear();

    events = calc.getEvent(tx, 'DepositReturned');

    assert.equal(events.length, 4, 'All tokens are losers (same value)');
    assert.equal(events[0].args.amount.toNumber(), deposit, 'A deposit is just the LONG deposit');
    assert.equal(events[1].args.amount.toNumber(), deposit, 'B deposit is just the LONG deposit');
    assert.equal(events[2].args.amount.toNumber(), deposit, 'A deposit is just the SHORT deposit');
    assert.equal(events[3].args.amount.toNumber(), deposit, 'B deposit is just the SHORT deposit');

    // The difference between no winners no losers (all losers)  AND that no  winners is that
    // in the first scenario there is no winnerBalance after losers check
    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance is 0');

    // Clear Short
    assert.ok(await future.clear.call(), 'Will clear WINNERS and finish');

    tx = await future.clear();
    events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, 0, 'No winner');


    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
  });


  it("Shall clear no losers", async () => {
    const { future } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, { clearInterval: 0 });
    let tx;
    let deposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice);
    let events;

    // Both investor A and investor B has 1 long 1 short.
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 4, investorA);

    await future.setTargetPrice(1.1 * futureData.defaultTargetPrice); // Long Wins

    // Clear 1 Losers
    assert.notOk(await future.clear.call(), 'First will clear LOSERS');
    tx = await future.clear();
    events = calc.getEvent(tx, 'DepositReturned');
    assert.equal(events.length, 0, 'No losers');

    // No losers
    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance is 0');

    // Clear Winners
    assert.ok(await future.clear.call(), 'Will clear WINNERS and finish');

    tx = await future.clear();
    events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, 1, 'All tokens are redeemed at once');

    assert.equal(events[0].args.amount.toNumber(), deposit * 4, 'A deposit is just the LONG deposit');


    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
  });

  it("Shall clear no winners", async () => {
    const { future } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address, { clearInterval: 0 });
    let tx;
    let deposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice);
    let events;

    // Both investor A and investor B has 1 long 1 short.
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 4, investorA);
    const updatePrice = 0.85 * futureData.defaultTargetPrice; // Long lose all deposit (Valid only for this set of prices)
    await future.setTargetPrice(updatePrice);

    // Clear 1 Losers
    assert.notOk(await future.clear.call(), 'First will clear LOSERS');
    tx = await future.clear();
    events = calc.getEvent(tx, 'DepositReturned');
    assert.equal(events.length, 0, 'No Deposit returned, all is lost');

    // All losers
    assert.equal((await future.winnersBalance()).toNumber(), deposit * 4, 'Winners Balance is all invested amount');

    // Clear Winners
    assert.ok(await future.clear.call(), 'Will clear WINNERS and finish');

    tx = await future.clear();
    events = calc.getEvent(tx, 'Benefits');
    assert.equal(events.length, 0, 'There are no benefits');

    // TODO, all winnder balance is giving to the manager, may need to change

    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
  });


  it("Shall clear with indivisible decimals", async () => {
    const { future } = await futureUtils.createDefaultFuture(providers.componentList, providers.mockMOT.address,
      { clearInterval: 0 });
    let tx;
    let events;

    // Both investor A and investor B has 4 Long.
    // The key of the test is that we cant divide by 3
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 1, investorA);
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 1, investorB);
    tx = await futureUtils.safeInvest(future, FutureDirection.Long, 1, investorC);

    // Investor B has 5 short
    tx = await futureUtils.safeInvest(future, FutureDirection.Short, 5, investorB);
    // This number is being chosen to create a decimal issue
    const updatePrice = new BigNumber(1.05112212 * futureData.defaultTargetPrice).add(777); // Force decimals
    await future.setTargetPrice(updatePrice); // Short lose  part

    assert.notOk(await future.clear.call(), 'First will clear LOSERS');
    tx = await future.clear();
    events = calc.getEvent(tx, 'DepositReturned');
    assert.equal(events.length, 5, '5 tokens lose');



    // Clear winners
    assert.ok(await future.clear.call(), 'Will clear WINNERS and finish');

    tx = await future.clear();
    events = calc.getEvent(tx, 'Benefits');

    assert.equal(events.length, 3, 'All tokens are redeemed at once');

    // TODO, all winner balance is giving to the manager, may need to change
    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
  });

});
