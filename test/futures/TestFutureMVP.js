const calc = require("../utils/calc");
const BigNumber = web3.BigNumber;

const {
  DerivativeProviders,
  DerivativeStatus,
  FutureDirection,
  DerivativeType,
  CheckPositionPhases,
  ClearPositionPhases,
  MutexStatus,
} = require("../utils/constants");
const futureUtils = require("./futureUtils");
const futureData = futureUtils.futureData;

const FutureContract = artifacts.require("FutureContractStub"); // FutureContract With functions for testing
const FutureToken = artifacts.require("FutureERC721Token");

const SHORT_WIN = 0.95; // For this default price this multiplier will make short win , long doesn't lose all the posit
const LONG_WIN = 1.05; // For this default price this multiplier will make long win , short doesn't lose all the posit
const SHORT_WIN_ALL = 0.9; // For this default price this multiplier will make short win , long will lose all
const LONG_WIN_ALL = 1.1; // For this default price this multiplier will make long win , short will lose all

/**
 *   ================= BASIC FLOW =================
 *   This test is creating a single future with heavily dependency among the test.
 *   Once the future has been closed can't continue testing.
 *    1. Separate by sections of what are you testing, document what are the preconditions expected.
 *    2. Reset all global settings at the end of each test or section.
 */

contract("Test Future MVP", accounts => {

  let future;
  let providers;

  const investorA = accounts[1];
  const investorB = accounts[2];
  let longToken; // FutureERC721Token
  let shortToken; // FutureERC721Token
  before("Initialize ComponentList", async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  // Set the timer to 0
  it("Create a future", async () => {
    future = await FutureContract.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      futureData.target,
      providers.mockMOT.address,
      futureData.amountOfTargetPerShare,

      futureData.depositPercentage,
      futureData.forceClosePositionDelta
    );

    assert.equal((await future.status()).toNumber(), 0); // new

    await future.initialize(providers.componentList.address, futureData.clearInterval, {
      value: web3.toWei(futureData.ethDeposit + 0.01, "ether")
    });
    const myProducts = await providers.market.getOwnProducts();

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


  it("Can\'t clear because the time out ", async () => {
    // When it reaches the end of the test, the interval will expired
    await calc.assertReverts(async () => await future.clear(),
      `Clear time out is ${futureData.clearInterval}s`);
  });

  it("Can\'t redeem all manager fee ", async () => {
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    await calc.assertReverts(async () => await future.getManagerFee(accumulatedFee),
      'Cant withdraw all before closed');
    const tx = await future.getManagerFee(new BigNumber(accumulatedFee).sub(futureUtils.INITIAL_FEE));
    assert.ok(tx, 'Can withdraw fee until the minumum fee');

    assert.equal((await future.accumulatedFee()).toNumber(), futureUtils.INITIAL_FEE,
      'Now accumulated fee is exactly 1 ETH');
  });

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await future.initialize(providers.componentList.address, futureData.clearInterval);
    }, "Shall revert");
  });

  it("Future initialized correctly", async () => {
    assert.equal(await future.name(), futureData.name);
    assert.equal(await future.description(), futureData.description);
    assert.equal(await future.symbol(), futureData.symbol);
    assert.equal(calc.bytes32ToString(await future.category()), futureData.category);
    assert(await future.version() !== '');
    assert.equal(await future.getTarget(), futureData.target);
    assert.equal(await future.getTargetAddress(), providers.mockMOT.address);
    assert.equal(await future.getDepositPercentage(), futureData.depositPercentage);
    assert.equal((await future.getAmountOfTargetPerShare()).toNumber(), futureData.amountOfTargetPerShare);
    assert.equal((await future.forceClosePositionDelta()).toNumber(), futureData.forceClosePositionDelta);
    assert.equal((await future.getDeliveryDate()).toNumber(), futureData.clearInterval);
    assert.equal(await future.fundType(), DerivativeType.Future);


  });
  // --------------------------------------------------------------------------
  // ----------------------------- Invest TEST  -------------------------------
  it("Can't invest without target price", async () => {
    const amountsOfShares = 2;
    const depositValue = web3.toWei(1, 'ether');

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, amountsOfShares, {
        from: investorA,
        value: depositValue * 2
      });
    }, "Shall revert if target price is 0");

  });

  it("Can't invest will is not active ", async () => {
    // future is already activate, create new future for this scenario
    const notActiveFuture = await FutureContract.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,
      futureData.target,
      providers.mockMOT.address,
      futureData.amountOfTargetPerShare,

      futureData.depositPercentage,
      futureData.forceClosePositionDelta
    );

    const amountsOfShares = 2;
    const depositValue = web3.toWei(1, 'ether');
    const targetPrice = futureData.defaultTargetPrice;
    await notActiveFuture.setTargetPrice(targetPrice);

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, amountsOfShares, {
        from: investorA,
        value: depositValue
      });
    }, "Shall revert if the future is not Active");

  });

  it("Invest => Se the price", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    await future.setTargetPrice(targetPrice);
    assert.equal((await future.getTargetPrice()).toNumber(), targetPrice);
  });

  it("It shall calculate share deposit correctly", async () => {


    let protocolDeposit = (await future.calculateShareDeposit(2, futureData.defaultTargetPrice)).toNumber();
    let testCalculation = futureUtils.calculateShareDeposit(2, futureData.defaultTargetPrice);
    assert.equal(protocolDeposit, testCalculation);

    protocolDeposit = (await future.calculateShareDeposit(0, futureData.defaultTargetPrice)).toNumber();
    testCalculation = futureUtils.calculateShareDeposit(0, futureData.defaultTargetPrice);
    assert.equal(protocolDeposit, testCalculation);

    protocolDeposit = (await future.calculateShareDeposit(2, 0)).toNumber();
    testCalculation = futureUtils.calculateShareDeposit(2, 0);
    assert.equal(protocolDeposit, testCalculation);

    await calc.assertReverts(
      async () => await future.calculateShareDeposit(2 ** 256 - 1, futureData.defaultTargetPrice),
        'Safe math avoid overflow'
    );



  });

  // TargetPrice was setted to 10**18
  it("Investor invest long", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    const amountsOfShares = 2;
    const depositValueBN = (await future.calculateShareDeposit(amountsOfShares, targetPrice));
    const balanceBefore = await calc.ethBalance(investorA);
    const extraDeposit = web3.toWei(0.72, 'ether'); // Shall be returned (random amount)
    let tx;

    tx = await future.invest(FutureDirection.Long, amountsOfShares, {
      from: investorA,
      value: depositValueBN.add(extraDeposit)
    });
    assert.ok(tx);
    const balanceAfter = await calc.ethBalance(investorA);
    assert(await calc.inRange(balanceAfter, balanceBefore - depositValueBN.div(10 ** 18).toNumber(), 0.01),
      ' Return exceed of deposit');
    const investorATokens = await longToken.getTokenIdsByOwner(investorA);

    assert.equal(investorATokens.length, amountsOfShares, 'Investor A got one token');
    assert.equal((await shortToken.getTokenIdsByOwner(investorA)).length, 0, 'Investor A got long');

    assert.equal((await longToken.getBuyingPrice(investorATokens[0])).toNumber(), targetPrice,
      'Target price is correct');
    assert.equal((await longToken.getDeposit(investorATokens[0])).toNumber(), depositValueBN.div(
      amountsOfShares), 'Deposit is correct');
    assert.equal((await longToken.isTokenValid(investorATokens[0])), true, 'Token is valid');
    assert.equal((await web3.eth.getBalance(future.address)).toNumber(), web3.toWei(0.5, 'ether'),
      '0.2 of 2 tokens + 0.1 of manager fee ');

  });


  it("Investor invest short", async () => {
    const targetPrice = futureData.defaultTargetPrice;
    const amountsOfShares = 2;
    const depositValue = (await future.calculateShareDeposit(amountsOfShares, targetPrice)).toNumber();
    const balanceBefore = await calc.ethBalance(investorB);
    const extraDeposit = web3.toWei(0.71, 'ether'); // Shall be returned (random amount)

    let tx;
    tx = await future.invest(FutureDirection.Short, amountsOfShares, {
      from: investorB,
      value: new BigNumber(depositValue).add(extraDeposit)
    });
    assert.ok(tx);
    const balanceAfter = await calc.ethBalance(investorB);
    assert(await calc.inRange(balanceAfter, balanceBefore - depositValue / 10 ** 18, 0.01),
      ' Return exceed of deposit');
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);

    assert.equal(investorBTokens.length, amountsOfShares, 'Investor B got one token');
    assert.equal((await longToken.getTokenIdsByOwner(investorB)).length, 0, 'Investor B got long');

    assert.equal((await shortToken.getBuyingPrice(investorBTokens[0])).toNumber(), targetPrice,
      'Target price is correct');
    assert.equal((await shortToken.getDeposit(investorBTokens[0])).toNumber(), depositValue / amountsOfShares,
      'Deposit is correct');
    assert.equal((await shortToken.isTokenValid(investorBTokens[0])), true, 'Token is valid');
    assert.equal((await web3.eth.getBalance(future.address)).toNumber(), web3.toWei(0.9, 'ether'),
      '0.2 of 4 tokens + 0.1 of manager fee ');

  });

  it("Token Red line ", async () => {

    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);
    const targetPrice = futureData.defaultTargetPrice;
    tokenDeposit = futureUtils.calculateShareDeposit(1, targetPrice); // For 1 token

    let redLine;
    // LONG
    redLine = (await future.getTokenBottomPosition(FutureDirection.Long, investorATokens[0])).toNumber();
    assert.equal(redLine, tokenDeposit - (tokenDeposit * futureData.forceClosePositionDelta / futureUtils.DENOMINATOR),
      'Red line for long tokens');
    // SHORT
    redLine = (await future.getTokenBottomPosition(FutureDirection.Short, investorBTokens[0])).toNumber();
    assert.equal(redLine, tokenDeposit - (tokenDeposit * futureData.forceClosePositionDelta / futureUtils.DENOMINATOR),
      'Red line for short tokens');
  });

  it("Investors actual value", async () => {
    let tokenValue;
    let updatePrice;
    let tokenDeposit;
    let tokenTestValue;

    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);

    const targetPrice = futureData.defaultTargetPrice;
    tokenDeposit = futureUtils.calculateShareDeposit(1, targetPrice); // For 1 token

    assert.equal(targetPrice, futureData.defaultTargetPrice,
      'Target price is the same as set in the configuration');
    assert.equal((await shortToken.getDeposit(investorATokens[0])).toNumber(), tokenDeposit,
      'Deposit is 2 E17 LONG');
    assert.equal((await shortToken.getDeposit(investorBTokens[0])).toNumber(), tokenDeposit,
      'Deposit is 2 E17 SHORT');

    // -------------------------- SAME PRICE -----------------------
    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], targetPrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      targetPrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the same when price no change LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], targetPrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      targetPrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the same when price no change SHORT');

    // -------------------------- PRICE LOW -----------------------
    updatePrice = SHORT_WIN * futureData.defaultTargetPrice; // SHORT win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the reduced for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is increased for SHORT');

    // -------------------------- PRICE HIGH -----------------------
    updatePrice = LONG_WIN * futureData.defaultTargetPrice; // LONG win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is the increased for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is reduced for SHORT');


    // -------------------------- PRICE is TOO LOW -----------------------
    updatePrice = SHORT_WIN_ALL * futureData.defaultTargetPrice; // SHORT win

    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    assert.equal(tokenValue, 0, 'Actual value is 0 for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value is really increased for SHORT');

    // -------------------------- PRICE is TOO HIGH -----------------------
    updatePrice = new BigNumber(LONG_WIN_ALL).mul(futureData.defaultTargetPrice).toNumber(); // LONG win
    // LONG
    tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0], updatePrice)).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(tokenValue, tokenTestValue, 'Actual value really the increased for LONG');
    // SHORT
    tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0], updatePrice)).toNumber();
    assert.equal(tokenValue, 0, 'Actual value is 0 for SHORT');

  });

  it("Investors my assets value", async () => {
    // Difference between this and the previous scenario, here is the total assets and
    // the price is the internal of the Future.
    let myAssetsValue;
    let tokenTestValue;
    const targetPrice = futureData.defaultTargetPrice;
    let updatePrice;
    const tokenDeposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice); // Initial Deposit
    const tokensACount = (await longToken.getTokenIdsByOwner(investorA)).length;
    const tokensBCount = (await shortToken.getTokenIdsByOwner(investorB)).length;

    // -------------------------- SAME PRICE -----------------------
    updatePrice = targetPrice;
    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();

    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensACount, 'Assets A normalPrice');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensBCount, 'Assets B normalPrice');

    // -------------------------- PRICE HIGH -----------------------
    updatePrice = SHORT_WIN * futureData.defaultTargetPrice; // SHORT win
    await future.setTargetPrice(updatePrice);

    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensACount, 'Assets A reduced');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensBCount, 'Assets B increased');

    // -------------------------- PRICE LOW -----------------------
    updatePrice = LONG_WIN * futureData.defaultTargetPrice; // LONG win

    await future.setTargetPrice(updatePrice);
    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensACount, 'Assets A increased');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensBCount, 'Assets B reduced');

    // -------------------------- PRICE is TOO LOW -----------------------
    updatePrice = SHORT_WIN_ALL * futureData.defaultTargetPrice; // SHORT win
    await future.setTargetPrice(updatePrice);
    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensACount, 'Assets A is 0');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensBCount, 'Assets B is too high');


    // -------------------------- PRICE is TOO HIGH -----------------------
    updatePrice = new BigNumber(LONG_WIN_ALL).mul(futureData.defaultTargetPrice).toNumber(); // LONG win
    await future.setTargetPrice(updatePrice);

    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Long, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensACount, 'Assets A is too high');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    tokenTestValue = futureUtils.getTokenActualValue(FutureDirection.Short, tokenDeposit, targetPrice,
      updatePrice);
    assert.equal(myAssetsValue, tokenTestValue * tokensBCount, 'Assets B is 0');

    // Reset
    await future.setTargetPrice(futureData.defaultTargetPrice);

  });

  // --------------------------------------------------------------------------
  // ----------------------------- Check Position TEST  -------------------------------
  // Required A and B to have 2 tokens each.


  it("Check position without disabling tokens", async () => {
    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, 1);

    // We set step provider to 1
    await future.setTargetPrice(new BigNumber(SHORT_WIN).mul(futureData.defaultTargetPrice));

    // 4 tokens, 4 calls
    await future.checkPosition();
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      1, 'Is started');
    /// MUTEX
    assert.equal((await future.productStatus()).toNumber(), MutexStatus.CHECK_POSITION);
    await calc.assertReverts(async () => await future.clear(), 'Mutex: Cant clear after check started');
    /// END MUTEX

    // Check that is frozen
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      1, 'Is started');

    await future.checkPosition();
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      2, 'Finish LONG');
    await future.checkPosition();
    await future.checkPosition();
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      0, 'Finish Short');

    // No red line cross, nothing is deactivated
    assert.notEqual((await longToken.getValidTokens()).length, 0, 'No token invalidated');
    assert.notEqual((await shortToken.getValidTokens()).length, 0, 'No token invalidated');

    // Reset
    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, futureData.maxSteps);
    await future.setTargetPrice(new BigNumber(LONG_WIN).mul(futureData.defaultTargetPrice));
    // Call at once
    await future.checkPosition();
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      0, 'Finish Check Position');

    // No redline cross, nothing is deactivated
    assert.notEqual((await longToken.getValidTokens()).length, 0, 'No token invalidated');
    assert.notEqual((await shortToken.getValidTokens()).length, 0, 'No token invalidated');
    assert.equal((await future.productStatus()).toNumber(), MutexStatus.AVAILABLE);

    // Reset
    await future.setTargetPrice(new BigNumber(1).mul(1 ** 18));
  });

  it("Check position Long go out", async () => {
    const investorATokens = await longToken.getTokenIdsByOwner(investorA);
    // This number make deposit go under bottom position but without getting value 0
    const updatePrice = new BigNumber(0.91).mul(futureData.defaultTargetPrice);
    const tokenDeposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice); // Initial Deposit

    // We set step provider to 1
    await future.setTargetPrice(updatePrice);
    const tokenValue = (await future.getTokenActualValue(FutureDirection.Long, investorATokens[0],
      updatePrice)).toNumber();

    assert(tokenValue > 0, 'Test scenario user is reimbursed part of his deposit while out');
    const tx = await future.checkPosition();

    let depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 2, 'Both tokens return deposit');
    depositEvents.forEach((depositEvent) => assert.equal(depositEvent.args.amount.toNumber(), tokenValue,
      'Remaining value is returned'));

    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      0, 'Finish Check Position');

    assert.equal((await longToken.getValidTokens()).length, 0, 'All long tokens invalidated');
    assert.notEqual((await shortToken.getValidTokens()).length, 0, 'All short tokens are still valid');

    assert.equal(await longToken.isTokenValid(investorATokens[0]), false, ' Token 0 invalid');
    assert.equal(await longToken.isTokenValid(investorATokens[1]), false, ' Token 1 invalid');

    const winnersBalance = (await future.winnersBalance()).toNumber();

    // We know that the tokenValue is higher than the redLine. There are two tokens
    // When the tokenValue is lower than the redline but not 0, remaining is returned
    const expectedWinnerBalance = (tokenDeposit - tokenValue) * 2;
    assert.equal(winnersBalance, expectedWinnerBalance, '');
    // 0.8 with manager fee, but we spend some fee on reimbursable
    const balance = (await web3.eth.getBalance(future.address)).toNumber();
    console.log('assert.isAbove:', web3.fromWei(balance, 'ether'));
    assert.isAbove(balance, web3.toWei(0.8, 'ether'), '0.8 of 4 tokens ');

  });

  it("Check position Short go out", async () => {
    const previousWinnerBalance = (await future.winnersBalance()).toNumber();

    const investorBTokens = await shortToken.getTokenIdsByOwner(investorB);
    const updatePrice = new BigNumber(1.09).mul(futureData.defaultTargetPrice);
    const tokenDeposit = futureUtils.calculateShareDeposit(1, futureData.defaultTargetPrice); // Initial Deposit

    // We set step provider to 1
    await future.setTargetPrice(updatePrice);
    const tokenValue = (await future.getTokenActualValue(FutureDirection.Short, investorBTokens[0],
      updatePrice)).toNumber();

    assert(tokenValue > 0, 'Test scenario user is reimbursing part of his deposit while out');
    const tx = await future.checkPosition();

    let depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 2, 'Both tokens return deposit');
    depositEvents.forEach((depositEvent) => assert.equal(depositEvent.args.amount.toNumber(), tokenValue,
      'Remaining value is returned'));

    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      0, 'Finish Check Position');

    assert.equal((await shortToken.getValidTokens()).length, 0, 'All long tokens invalidated');

    assert.equal(await shortToken.isTokenValid(investorBTokens[0]), false, ' Token 0 invalid');
    assert.equal(await shortToken.isTokenValid(investorBTokens[1]), false, ' Token 1 invalid');
    assert.equal((await shortToken.getValidTokens()).length, 0, 'Valid tokens filter return empty');
    const winnersBalance = (await future.winnersBalance()).toNumber();

    // We know that the tokenValue is higher than the redLine. There are two tokens
    // When the tokenValue is lower than the redline but not 0, remaining is returned
    const expectedWinnerBalance = (tokenDeposit - tokenValue) * 2;

    assert.equal(winnersBalance, previousWinnerBalance + expectedWinnerBalance, '');

    // 0.8 with manager fee, but we spend some fee on reimbursable
    assert.isAbove((await web3.eth.getBalance(future.address)).toNumber(), web3.toWei(0.8, 'ether'),
      '0.8 of 4 tokens ');

  });
  it("ETH balance is the winnersBalance + managment Fee", async () => {

    const accumulatedFee = (await future.accumulatedFee()); // We keep it in BigNumber
    const winnersBalance = (await future.winnersBalance()); // We keep it in BigNumber

    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      winnersBalance.add(accumulatedFee).toString(),
      'No ETH extra after the checks (accFee + winnersBalance)'
    );
  });
  it("Check position with invalid tokens and time out", async () => {
    const interval = 2; // seconds
    await future.setTimeInterval(DerivativeProviders.CHECK_POSITION, interval);
    let tx;
    // This line also checks checkPosition when there are not valid tokens
    tx = await future.checkPosition();
    assert.ok(tx);
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      0, 'Finish Check Position');

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

  it("Investors my assets value with invalid tokens", async () => {
    // getMy assets value Ingores the invalid tokens
    let myAssetsValue;


    // -------------------------- SAME PRICE -----------------------
    // LONG
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Long, {
      from: investorA
    })).toNumber();
    assert.equal(myAssetsValue, 0, 'Assets A are all invalid');
    // SHORT
    myAssetsValue = (await future.getMyAssetValue(FutureDirection.Short, {
      from: investorB
    })).toNumber();
    assert.equal(myAssetsValue, 0, 'Assets B are all invalid');
  });


  // --------------------------------------------------------------------------
  // ----------------------------- CLEAR position  -------------------------------
  // A and B start with two invalidate
  // Fund will be come closed with CLEAR position


  it("Clear position - Pre Conditions ", async () => {

    const amountsOfShares = 2;
    let updatePrice;
    const depositValue = web3.toWei(LONG_WIN_ALL, 'ether'); // Enough for all the purchases

    // Long and short will by 2 amounts with hight and low price, we will default at base price, so he is suppose to lose two tokens and be winner
    // in the other two tokens.
    // -------------------------- PRICE is LOW  -----------------------
    updatePrice = SHORT_WIN * futureData.defaultTargetPrice; // SHORT win
    await future.setTargetPrice(updatePrice);
    await future.invest(FutureDirection.Long, amountsOfShares, {
      from: investorA,
      value: depositValue * amountsOfShares
    });
    await future.invest(FutureDirection.Short, amountsOfShares, {
      from: investorB,
      value: depositValue * amountsOfShares
    });
    // -------------------------- PRICE is HIGHT  -----------------------
    updatePrice = LONG_WIN * futureData.defaultTargetPrice; // LONG win
    await future.setTargetPrice(updatePrice);
    await future.invest(FutureDirection.Long, amountsOfShares, {
      from: investorA,
      value: depositValue * amountsOfShares
    });
    await future.invest(FutureDirection.Short, amountsOfShares, {
      from: investorB,
      value: depositValue * amountsOfShares
    });

    // -------------------------- CHECK PRECONDITIONS  -----------------------

    const validTokensA = await longToken.getValidTokenIdsByOwner(investorA);
    const validTokensB = await shortToken.getValidTokenIdsByOwner(investorB);

    // amountsOfShares * 2 because we bougth twice
    assert.equal(validTokensA.length, amountsOfShares * 2, 'A has 4 valid tokens');
    assert.equal(validTokensB.length, amountsOfShares * 2, 'A has 4 valid tokens');

    // Reset
    await future.setTargetPrice(futureData.defaultTargetPrice);
  });

  it("Clear position  ", async () => {

    const maxSteps = 2;
    let tx;

    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, maxSteps);
    // Until now valid tokens are 8. (4 steps), then 4 winners that belongs two 2 holders  (2 steps more)

    /// --------------------------- CHECKING LOSER TOKENS ---------------------------
    /// Checking LONG
    // -> Call 1
    assert.notOk(await future.clear.call(), 'Function will in progress');
    tx = await future.clear();
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CLEAR),
      ClearPositionPhases.CalculateLoses, ' Loses started');
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      CheckPositionPhases.LongTokens, 'Long started');
    assert.equal((await providers.stepProvider.currentFunctionStep(future.address, DerivativeProviders.CHECK_POSITION))
      .toNumber(), maxSteps, 'Long 2 steps');
    let depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 0, 'The first two tokens of Long are winners ');

    //// MUTEX
    assert.equal((await future.productStatus()).toNumber(), MutexStatus.CLEAR);
    await calc.assertReverts(async () => await future.checkPosition(),
      'Mutex: Cant check after clear started');
    /// END MUTEX

    // Frozen variables In the first cal
    assert.equal((await future.status()).toNumber(), DerivativeStatus.Closed, 'Future is closed');
    assert.equal((await future.frozenPrice()).toNumber(), futureData.defaultTargetPrice, 'Price is frozen');
    assert.equal((await future.frozenTotalWinnersSupply()).toNumber(), 0, 'Winner supply yet is not frozen');

    // -> Call 2
    assert.notOk(await future.clear.call(), 'Function will in progress');
    tx = await future.clear();
    assert.equal((await providers.stepProvider.currentFunctionStep(future.address, DerivativeProviders.CHECK_POSITION))
      .toNumber(), 0, 'Long Finish');
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      CheckPositionPhases.ShortTokens, 'Short started');

    depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 2, 'The first two tokens of Long are losers ');
    // This tokens of Long are lost when the price was high

    const longLostTokenActualValue = futureUtils.getTokenActualValue(
      FutureDirection.Long,
      futureUtils.calculateShareDeposit(1, LONG_WIN * futureData.defaultTargetPrice),
      LONG_WIN * futureData.defaultTargetPrice,
      futureData.defaultTargetPrice
    );
    depositEvents.forEach((depositEvent) => assert.equal(
      depositEvent.args.amount.toNumber(), longLostTokenActualValue,
      'Returned the remaining value of LONG lost token'));

    /// Checking SHORT
    // -> Call 3
    assert.notOk(await future.clear.call(), 'Function will in progress');
    tx = await future.clear();
    assert.equal((await providers.stepProvider.currentFunctionStep(future.address, DerivativeProviders.CHECK_POSITION))
      .toNumber(), maxSteps, '3nd step');
    depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 2, 'The first two tokens of Short are losers ');
    // Short lost tokens bought when price was low (SHORT_WIN)
    const shortLostTokenActualValue = futureUtils.getTokenActualValue(
      FutureDirection.Short,
      futureUtils.calculateShareDeposit(1, SHORT_WIN * futureData.defaultTargetPrice),
      SHORT_WIN * futureData.defaultTargetPrice,
      futureData.defaultTargetPrice
    );

    depositEvents.forEach((depositEvent) => assert.equal(
      depositEvent.args.amount.toNumber(), shortLostTokenActualValue,
      'Returned the remaining value of SHORT lost token'));

    // -> Call 4
    assert.notOk(await future.clear.call(), 'Function will in progress');
    tx = await future.clear();
    depositEvents = calc.getEvent(tx, 'DepositReturned');
    assert.equal(depositEvents.length, 0, 'The second two tokens of Short are winners ');
    assert.equal((await providers.stepProvider.currentFunctionStep(future.address, DerivativeProviders.CHECK_POSITION))
      .toNumber(), 0, 'Finished Losers');

    /// --------------------------- CHECKING WINNER TOKENS PRE CONDITIONS ---------------------------
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CLEAR),
      ClearPositionPhases.CalculateBenefits, ' Winners started');
    const winnersAfter = (await future.frozenTotalWinnersSupply()).toNumber();
    // TODO: Check the winnersAfter is winnerBalance + reamining of the losers
    assert.equal(winnersAfter, 4, '2 tokens from short and 2 from long are winners');
    // Calculate A and B expected benefits, which is, the deposit that are returned + half of the winners balance (as both have 2 of the 4 tokens)
    // TODO (a function to refactor this logic)
    const previousWinnerBalance = (await future.winnersBalance()).toNumber();
    const validTokensADeposit = await Promise.all(
      (await longToken.getValidTokenIdsByOwner(investorA)).map(
        async (id) => await longToken.getDeposit(id)
      )
    );
    const benefitsA =
      validTokensADeposit.reduce((total, deposit) => total + deposit.toNumber(), 0) // Sum all deposits
      +
      previousWinnerBalance / 2;
    const validTokensBDeposit = await Promise.all(
      (await shortToken.getValidTokenIdsByOwner(investorB)).map(
        async (id) => await shortToken.getDeposit(id)
      )
    );
    const benefitsB =
      validTokensBDeposit.reduce((total, deposit) => total + deposit.toNumber(), 0) +
      previousWinnerBalance / 2;

    /// --------------------------- CHECKING WINNER TOKENS ---------------------------

    /// Checking LONG
    // -> Call 1
    assert.notOk(await future.clear.call(), 'Function will in progress');
    tx = await future.clear();


    let benefitsEvents = calc.getEvent(tx, 'Benefits');
    assert.equal(benefitsEvents.length, 1, 'There are 2 tokens, but 1 holder');
    assert.equal(benefitsEvents[0].args.amount.toNumber(), benefitsA, 'A receive correct deposits + benefits');

    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      CheckPositionPhases.ShortTokens, 'Short started');

    /// Checking SHORT
    // -> Call 2
    assert.ok(await future.clear.call(), 'Function will in finish');
    tx = await future.clear();

    benefitsEvents = calc.getEvent(tx, 'Benefits');
    assert.equal(benefitsEvents.length, 1, 'There are 2 tokens, but 1 holder');
    assert.equal(benefitsEvents[0].args.amount.toNumber(), benefitsB, 'B receive correct deposits + benefits');

    /// --------------------------- EVERYTHING RESETS ---------------------------
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CHECK_POSITION),
      CheckPositionPhases.Initial, 'Check tokens finish');
    assert.equal(await futureUtils.getStepStatus(future, providers.stepProvider, DerivativeProviders.CLEAR),
      ClearPositionPhases.Initial, 'Clear finish');

    assert.equal((await future.frozenTotalWinnersSupply()).toNumber(), 0, 'Winners Supply reset');
    assert.equal((await future.winnersBalance()).toNumber(), 0, 'Winners Balance reset');
    assert.equal((await future.frozenPrice()).toNumber(), 0, 'frozend price reset');
    assert.equal((await future.winnersBalanceRedeemed()).toNumber(), 0, 'frozend price reset');


    assert.equal((await longToken.getValidTokens()).length, 0, 'All LONG tokens invalid');
    assert.equal((await shortToken.getValidTokens()).length, 0, 'All SHORT tokens invalid');
    assert.equal((await future.productStatus()).toNumber(), MutexStatus.AVAILABLE);

    // No ETH holded
    assert.equal(
      (await web3.eth.getBalance(future.address)).toString(),
      (await future.accumulatedFee()).toString(),
      'All ETH has been returned (a exception of manager fee)'
    );
    // Reset
    await future.setMaxSteps(DerivativeProviders.CHECK_POSITION, futureData.maxSteps);

  });

  it("Future can\'t execute after close", async () => {
    await calc.assertReverts(
      async () => await await future.invest(FutureDirection.Long, 1, {
        from: investorA,
        value: web3.toWei(1, 'ether')
      }), 'Can\' invest once is closed'
    );

    await calc.assertReverts(async () => await future.checkPosition(), 'Can\' check position once is closed');
    await calc.assertReverts(async () => await future.clear(), 'Can\' clear once is closed');
  })


  it("Manager can redeem all acc Fee", async () => {
    const balanceBefore = await calc.ethBalance(accounts[0]);
    const accumulatedFee = (await future.accumulatedFee()).toNumber();
    const tx = await future.getManagerFee(accumulatedFee);
    assert.ok(tx);
    assert.equal((await web3.eth.getBalance(future.address)).toString(), 0, 'Future is empty');
    assert.equal((await future.accumulatedFee()).toNumber(), 0, 'Acc fee is withdrawed');
    assert.isAbove(await calc.ethBalance(accounts[0]), balanceBefore, 'Got the remaining fee back');
  })

});
