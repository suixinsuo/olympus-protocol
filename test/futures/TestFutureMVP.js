const log = require("../utils/log");
const calc = require("../utils/calc");
const BigNumber = require("BigNumber.js");

const {
  DerivativeProviders,
  FutureDirection,
} = require("../utils/constants");

const FutureContract = artifacts.require("FutureContractStub"); // FutureContract With functions for testing
const Marketplace = artifacts.require("Marketplace");
const Locker = artifacts.require("Locker");
const StepProvider = artifacts.require("StepProvider");

const Reimbursable = artifacts.require("Reimbursable");
const ComponentList = artifacts.require("ComponentList");
const FutureToken = artifacts.require("FutureERC721Token");
const MockToken = artifacts.require("MockToken");

const DENOMINATOR = 10000;
const futureData = {
  name: "Future Test",
  description: "Sample of future mvp",
  symbol: 'FTK',

  version: 'v0.2',
  target: 1,
  clearInterval: 1, // seconds
  amountOfTargetPerShare: 2,
  depositPercentage: 0.1 * DENOMINATOR, // 1000 DENOMINATOR
  forceClosePositionDelta: 0.8 * DENOMINATOR,
  ethDeposit: 0.1, // 'ETHER'
  maxSteps: 10, // hardcoded in the derivative
  defaultTargetPrice: 10 ** 18,
};


const calculateShareDeposit = (_amountOfShares, price) => {
  // Price for 1 share
  return (_amountOfShares * futureData.amountOfTargetPerShare * price * futureData.depositPercentage) / DENOMINATOR;
}

// Actual Value
const getTokenActualValue = (direction, deposit, startPrice, currentPrice) => {
  const pricePercentage = (startPrice - currentPrice) / startPrice * (DENOMINATOR / futureData.depositPercentage);
  return deposit + direction * deposit * pricePercentage;
}


contract("Basic Future", accounts => {

  let future;
  let market;
  let mockMOT;
  let locker;
  let reimbursable;
  let stepProvider;
  let componentList;

  const investorA = accounts[1];
  const investorB = accounts[2];
  let longToken; // FutureERC721Token
  let shortToken; // FutureERC721Token
  before("Initialize ComponentList", async () => {

    market = await Marketplace.deployed();
    mockMOT = await MockToken.deployed();
    locker = await Locker.deployed();
    reimbursable = await Reimbursable.deployed();
    stepProvider = await StepProvider.deployed();

    componentList = await ComponentList.deployed();

    await reimbursable.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);
    componentList.setComponent(DerivativeProviders.STEP, stepProvider.address);

  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  // Set the timer to 0
  it("Create a future", async () => {
    future = await FutureContract.new(
      futureData.name,
      futureData.description,
      futureData.symbol,

      futureData.target,
      mockMOT.address,
      futureData.amountOfTargetPerShare,

      futureData.depositPercentage,
      futureData.forceClosePositionDelta
    );

    assert.equal((await future.status()).toNumber(), 0); // new

    await future.initialize(componentList.address, futureData.clearInterval, {
      value: web3.toWei(futureData.ethDeposit, "ether")
    });
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], future.address);
    assert.equal((await future.status()).toNumber(), 1); // Active

    // We have created two new ERC721, check the address is not 0
    const longAddress = await future.getLongToken();
    const shortAddress = await future.getShortToken();

    assert.ok(parseInt(longAddress) != 0, 'Long token is set');
    assert.ok(parseInt(shortAddress) != 0, 'Short token is set');

    longToken = new FutureToken(longAddress);
    shortToken = new FutureToken(shortAddress);

    assert.equal(await longToken.owner(), future.address);
    assert.equal((await longToken.tokenPosition()).toNumber(), FutureDirection.Long, 'Long token is long');

    assert.equal(await shortToken.owner(), future.address);
    assert.equal((await shortToken.tokenPosition()).toNumber(), FutureDirection.Short, 'Short token is short');

    // Config for the stub
    await future.setTimeInterval(DerivativeProviders.CHECK_POSITION, 0);
  });


  // --------------------------------------------------------------------------
  // ----------------------------- CONFIG TEST  -------------------------------

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await future.initialize(componentList.address, futureData.clearInterval);
    }, "Shall revert");
  });

  it("Future initialized correctly", async () => {
    assert.equal(await future.name(), futureData.name);
    assert.equal(await future.description(), futureData.description);
    assert.equal(await future.symbol(), futureData.symbol);
    assert.equal(await future.version(), "v0.1");
    assert.equal(await future.getTarget(), futureData.target);
    assert.equal(await future.getTargetAddress(), mockMOT.address);
    assert.equal(await future.getDepositPercentage(), futureData.depositPercentage);
    assert.equal((await future.getAmountOfTargetPerShare()).toNumber(), futureData.amountOfTargetPerShare);
    assert.equal((await future.forceClosePositionDelta()).toNumber(), futureData.forceClosePositionDelta);
    assert.equal((await future.getDeliveryDate()).toNumber(), futureData.clearInterval);


  });
  // --------------------------------------------------------------------------
  // ----------------------------- Invest TEST  -------------------------------
  it("Can't invest without target price", async () => {
    const amountsOfShares = 2;
    const depositValue = web3.toWei(1, 'ether');

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, amountsOfShares, { from: investorA, value: depositValue * 2 });
    }, "Shall revert if target price is 0");

  });

  it("Can't invest will is not active ", async () => {
    // future is already activate, create new future for this scenario
    const notActiveFuture = await FutureContract.new(
      futureData.name,
      futureData.description,
      futureData.symbol,

      futureData.target,
      mockMOT.address,
      futureData.amountOfTargetPerShare,

      futureData.depositPercentage,
      futureData.forceClosePositionDelta
    );

    const amountsOfShares = 2;
    const depositValue = web3.toWei(1, 'ether');
    const targetPrice = futureData.defaultTargetPrice;
    await notActiveFuture.setTargetPrice(targetPrice);

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, amountsOfShares, { from: investorA, value: depositValue * 2 });
    }, "Shall revert if the future is not Active");

  });

  it("Invest == Se the price", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    await future.setTargetPrice(targetPrice);
    assert.equal((await future.getTargetPrice()).toNumber(), targetPrice);
  });

  it("It shall calculate share deposit correctly", async () => {


    let protocolDeposit = (await future.calculateShareDeposit(2, 10 ** 18)).toNumber();
    let testCalculation = calculateShareDeposit(2, 10 ** 18);
    assert.equal(protocolDeposit, testCalculation);

    protocolDeposit = (await future.calculateShareDeposit(0, 10 ** 18)).toNumber();
    testCalculation = calculateShareDeposit(0, 10 ** 18);
    assert.equal(protocolDeposit, testCalculation);

    protocolDeposit = (await future.calculateShareDeposit(2, 0)).toNumber();
    testCalculation = calculateShareDeposit(2, 0);
    assert.equal(protocolDeposit, testCalculation);

    testCalculation = calculateShareDeposit(2 ** 256 - 1, 10 ** 18);
    await calc.assertReverts(
      async () => await future.calculateShareDeposit(2 ** 256 - 1, 10 ** 18),
      'Safe math avoid overflow'
    );



  });

  // SET targetPrice to 10**18

  it("Investor invest long", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    const amountsOfShares = 2;
    const depositValue = (await future.calculateShareDeposit(amountsOfShares, targetPrice)).toNumber();
    const balanceBefore = await calc.ethBalance(investorA);

    let tx;
    tx = await future.invest(FutureDirection.Long, amountsOfShares, { from: investorA, value: depositValue * 2 });
    assert.ok(tx);
    const balanceAfter = await calc.ethBalance(investorA);

    assert(await calc.inRange(balanceAfter, balanceBefore - (depositValue / 10 ** 18), 1), ' Return exceed of deposit');
    const investorATokens = await longToken.getTokenIdsByOwner(investorA);

    assert.equal(investorATokens.length, amountsOfShares, 'Investor A got one token');
    assert.equal((await shortToken.getTokenIdsByOwner(investorA)).length, 0, 'Investor A got only long');

    assert.equal((await longToken.getBuyingPrice(investorATokens[0])).toNumber(), targetPrice, 'Target price is correct');
    assert.equal((await longToken.getDeposit(investorATokens[0])).toNumber(), depositValue / amountsOfShares, 'Deposit is correct');
    assert.equal((await longToken.isTokenValid(investorATokens[0])), true, 'Token is valid');

  });


  it("Investor invest short", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    const amountsOfShares = 2;
    const depositValue = (await future.calculateShareDeposit(amountsOfShares, targetPrice)).toNumber();
    const balanceBefore = await calc.ethBalance(investorB);

    let tx;
    tx = await future.invest(FutureDirection.Short, amountsOfShares, { from: investorB, value: depositValue * 2 });
    assert.ok(tx);
    const balanceAfter = await calc.ethBalance(investorB);

    assert(await calc.inRange(balanceAfter, balanceBefore - (depositValue / 10 ** 18), 1), ' Return exceed of deposit');
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);

    assert.equal(investorBTokens.length, amountsOfShares, 'Investor B got one token');
    assert.equal((await longToken.getTokenIdsByOwner(investorB)).length, 0, 'Investor B got only long');

    assert.equal((await shortToken.getBuyingPrice(investorBTokens[0])).toNumber(), targetPrice, 'Target price is correct');
    assert.equal((await shortToken.getDeposit(investorBTokens[0])).toNumber(), depositValue / amountsOfShares, 'Deposit is correct');
    assert.equal((await shortToken.isTokenValid(investorBTokens[0])), true, 'Token is valid');

  });

  it("Token Red line ", async () => {

    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);
    const targetPrice = futureData.defaultTargetPrice;
    tokenDeposit = calculateShareDeposit(1, targetPrice); // For 1 token

    let redLine;
    // LONG
    redLine = (await future.getTokenRedLine(FutureDirection.Long, investorATokens[0])).toNumber();
    assert.equal(redLine, tokenDeposit - (tokenDeposit * futureData.forceClosePositionDelta / DENOMINATOR), 'Red line for long tokens');
    // SHORT
    redLine = (await future.getTokenRedLine(FutureDirection.Short, investorBTokens[0])).toNumber();
    assert.equal(redLine, tokenDeposit - (tokenDeposit * futureData.forceClosePositionDelta / DENOMINATOR), 'Red line for short tokens');
  });

  it("Investors actual value", async () => {
    let tokenValue;
    let updatePrice;
    let tokenDeposit;
    let tokenTestValue;

    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);

    const targetPrice = futureData.defaultTargetPrice;
    tokenDeposit = calculateShareDeposit(1, targetPrice); // For 1 token

    assert.equal(targetPrice, 10 ** 18, 'Target price is the same as set in the configuration');
    assert.equal((await shortToken.getDeposit(investorATokens[0])).toNumber(), tokenDeposit, 'Deposit is 2 E17 LONG');
    assert.equal((await shortToken.getDeposit(investorBTokens[0])).toNumber(), tokenDeposit, 'Deposit is 2 E17 SHORT');

    // -------------------------- SAME PRICE -----------------------
    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], targetPrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice, targetPrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the same when price no change LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], targetPrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice, targetPrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the same when price no change SHORT');

    // -------------------------- PRICE HIGH -----------------------
    updatePrice = 0.95 * 10 ** 18; // SHORT win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the reduced for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is increased for SHORT');

    // -------------------------- PRICE LOW -----------------------
    updatePrice = 1.05 * 10 ** 18; // LONG win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the increased for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is reduced for SHORT');


    // -------------------------- PRICE is TOO LOW -----------------------
    updatePrice = 0.9 * 10 ** 18; // SHORT win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    assert.equal(tokenValue, 0, 'Actual value is 0 for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is really increased for SHORT');

    // -------------------------- PRICE is TOO HIGH -----------------------
    updatePrice = new BigNumber(1.1).mul(10 ** 18).toNumber(); // LONG win
    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice, updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value really the increased for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    assert.equal(tokenValue, 0, 'Actual value is 0 for SHORT');

  });

  // --------------------------------------------------------------------------
  // ----------------------------- Check Position TEST  -------------------------------
  // Required A and B to have 2 tokens each.


  it("Check position without disabling tokens", async () => {
    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, 1);

    // We set step provider to 1
    await future.setTargetPrice(new BigNumber(0.95).mul(10 ** 18));

    // 4 tokens, 4 calls
    await future.checkPosition();
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 1, 'Is started');
    // Check that is freeze
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 1, 'Is started');

    await future.checkPosition();
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 2, 'Finish LONG');
    await future.checkPosition();
    await future.checkPosition();
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 0, 'Finish Short');

    // No red line cross, nothing is deactivated
    assert.equal((await future.outLongSupply()).toNumber(), 0, 'No token invalidated');
    assert.equal((await future.outShortSupply()).toNumber(), 0, 'No token invalidated');

    // Reset
    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, futureData.maxSteps);
    await future.setTargetPrice(new BigNumber(1.05).mul(10 ** 18));
    // Call at once
    await future.checkPosition();
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 0, 'Finish Check Position');

    // No redline cross, nothing is deactivated
    assert.equal((await future.outLongSupply()).toNumber(), 0, 'No token invalidated');
    assert.equal((await future.outShortSupply()).toNumber(), 0, 'No token invalidated');
    // Reset
    await future.setTargetPrice(new BigNumber(1).mul(1 ** 18));
  });

  it("Check position Long go out", async () => {
    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    const updatedPrice = new BigNumber(0.91).mul(10 ** 18);
    const tokenDeposit = calculateShareDeposit(1, 10 ** 18); // Initial Deposit

    // We set step provider to 1
    await future.setTargetPrice(updatedPrice);
    const tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatedPrice)).toNumber();

    assert(tokenValue > 0, 'Test scenario user is reiumbursed part of his deposit while out');
    const tx = await future.checkPosition();
    assert.equal(calc.getEvent(tx, 'DepositReturned'), 2, 'Both tokens return deposit');
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 0, 'Finish Check Position');

    assert.equal((await future.outLongSupply()).toNumber(), investorATokens.length, 'All long tokens invalidated');
    assert.equal((await future.outShortSupply()).toNumber(), 0, 'All short tokens are still valid');

    assert.equal(await longToken.isTokenValid(investorATokens[0]), false, ' Token 0 invalid');
    assert.equal(await longToken.isTokenValid(investorATokens[1]), false, ' Token 1 invalid');

    const winnersBalance = (await future.winnersBalance()).toNumber();

    // We know that the tokenValue is higher than the redLine. There are two tokens
    // When the tokenValue is lower than the redline but not 0, remaining is returned
    const expectedWinnerBalance = (tokenDeposit - tokenValue) * 2;
    assert.equal(winnersBalance, expectedWinnerBalance, '');

  });

  it("Check position Short go out", async () => {
    const previousWinnerBalance = (await future.winnersBalance()).toNumber();

    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);
    const updatedPrice = new BigNumber(1.09).mul(10 ** 18);
    const tokenDeposit = calculateShareDeposit(1, 10 ** 18); // Initial Deposit

    // We set step provider to 1
    await future.setTargetPrice(updatedPrice);
    const tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatedPrice)).toNumber();

    assert(tokenValue > 0, 'Test scenario user is reimbursing part of his deposit while out');
    const tx = await future.checkPosition();
    assert.equal(calc.getEvent(tx, 'DepositReturned'), 2, 'Both tokens return deposit');
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 0, 'Finish Check Position');

    assert.equal((await future.outShortSupply()).toNumber(), investorBTokens.length, 'All long tokens invalidated');

    assert.equal(await shortToken.isTokenValid(investorBTokens[0]), false, ' Token 0 invalid');
    assert.equal(await shortToken.isTokenValid(investorBTokens[1]), false, ' Token 1 invalid');
    assert.equal((await shortToken.getValidTokens()).length, 0, 'Valid tokens filter return empty');
    const winnersBalance = (await future.winnersBalance()).toNumber();

    // We know that the tokenValue is higher than the redLine. There are two tokens
    // When the tokenValue is lower than the redline but not 0, remaining is returned
    const expectedWinnerBalance = (tokenDeposit - tokenValue) * 2;
    assert.equal(winnersBalance, previousWinnerBalance + expectedWinnerBalance, '');

  });
  it("Check position with invalid tokens and time out", async () => {
    const interval = 2; // seconds
    await future.setTimeInterval(DerivativeProviders.CHECK_POSITION, interval);
    let tx;
    // This line also checks checkPosition when there are not valid tokens
    tx = await future.checkPosition();
    assert.ok(tx);
    assert.equal((await stepProvider.status(future.address, DerivativeProviders.CHECK_POSITION)).toNumber(), 0, 'Finish Check Position');

    // The timer got enabled
    await calc.assertReverts(
      async () => await future.checkPosition(), "Locker is active"
    );

    await calc.waitSeconds(interval);
    tx = await future.checkPosition();
    assert.ok(tx);
    // Reset data
    await future.setTimeInterval(DerivativeProviders.CHECK_POSITION, 0);
    await calc.waitSeconds(interval);
    await future.setTargetPrice(futureData.defaultTargetPrice);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- CLEAR position  -------------------------------
  // A and B start with two invalidate


});
