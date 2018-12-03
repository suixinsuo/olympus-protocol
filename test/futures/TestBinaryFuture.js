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
const futureData = futureUtils.binaryFutureData;
const BinaryFutureToken = artifacts.require("BinaryFutureERC721Token");

const BinaryFuture = artifacts.require("BinaryFuture");

/**
 *   ================= BASIC FLOW =================
 *   This test is creating a single future with heavily dependency among the test.
 *   Once the future has been closed can't continue testing.
 *    1. Separate by sections of what are you testing, document what are the preconditions expected.
 *    2. Reset all global settings at the end of each test or section.
 */



contract("Test Binary Future", accounts => {

  let future;
  let providers;


  const investorA = accounts[1];
  const investorB = accounts[2];
  let longToken;
  let shortToken;
  before("Initialize ComponentList", async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  // Set the timer to 0
  it("Create a future", async () => {
    future = await BinaryFuture.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      providers.tokens[0], // A token from Kyber

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
    assert.equal(await future.getTargetAddress(), providers.tokens[0]);
    assert.equal(await future.fundType(), DerivativeType.Future);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- Invest TEST  -------------------------------
  it("Can't invest will is not active ", async () => {
    // future is already activate, create new future for this scenario
    const notActiveFuture = await BinaryFuture.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      providers.tokens[0], // A token from Kyber

    );

    const amountsOfShares = 2;
    const depositValue = web3.toWei(1, 'ether');

    await calc.assertReverts(async () => {
      await notActiveFuture.invest(FutureDirection.Long, amountsOfShares, { from: investorA, value: depositValue });
    }, "Shall revert if the future is not Active");

  });

  it("Get price from kyber", async () => {
    assert((await future.getTargetPrice()).eq(futureData.defaultTargetPrice));
  });



});
