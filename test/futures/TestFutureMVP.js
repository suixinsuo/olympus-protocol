const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  FutureDirection,
} = require("../utils/constants");

const FutureContract = artifacts.require("FutureContract");
const Marketplace = artifacts.require("Marketplace");
const Locker = artifacts.require("Locker");
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
};

const calculateShareDeposit = (_amountOfShares, price) => {
  // Price for 1 share
  return (_amountOfShares * futureData.amountOfTargetPerShare * price * futureData.depositPercentage) / DENOMINATOR;
}



contract("Basic Future", accounts => {

  let future;
  let market;
  let mockMOT;
  let locker;
  let reimbursable;
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

    componentList = await ComponentList.deployed();

    await reimbursable.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);

  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------

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
    const targetPrice = 10 ** 18
    await notActiveFuture.setTargetPrice(targetPrice);

    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, amountsOfShares, { from: investorA, value: depositValue * 2 });
    }, "Shall revert if the future is not Active");

  });

  it("Invest == Se the price", async () => {
    const targetPrice = 10 ** 18
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

    testCalculation = calculateShareDeposit(2 ** 200, 10 ** 18);
    await calc.assertInvalidOpCode(
      async () => await future.calculateShareDeposit(2 ** 200, 10 ** 18),
      'Safe math avoid overflow'
    );



  });

  // SET targetPrice to 10**18

  it("Investor invest long", async () => {
    const targetPrice = (await future.getTargetPrice()).toNumber();
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
    assert.equal((await longToken.getDeposit(investorATokens[0])).toNumber(), depositValue, 'Deposit is correct');
    assert.equal((await longToken.isTokenValid(investorATokens[0])), true, 'Token is valid');

  });


  it("Investor invest short", async () => {
    const targetPrice = (await future.getTargetPrice()).toNumber();
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
    assert.equal((await shortToken.getDeposit(investorBTokens[0])).toNumber(), depositValue, 'Deposit is correct');
    assert.equal((await shortToken.isTokenValid(investorBTokens[0])), true, 'Token is valid');

  });

});
