const calc = require('../utils/calc');
const BigNumber = web3.BigNumber;

const { FutureDirection, DerivativeType } = require('../utils/constants');
const futureUtils = require('./futureUtils');
const binaryUtils = require('./futureBinaryUtils');
const futureData = binaryUtils.oraclizedData;

const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');

const OraclizedBinaryFuture = artifacts.require('OraclizedBinaryFuture');



/**
 *   ================= BASIC FLOW =================
 *   The Oraclized Binary Future extends from Binary Future, so here we will just check the concrete scenarios
  *    1. Separate by sections of what are you testing, document what are the preconditions expected.
 *    2. Reset all global settings at the end of each test or section.
 */

contract('Test Binary Future', accounts => {
  let future;
  let providers;

  const investorA = accounts[1];

  before('Initialize ComponentList', async () => {
    providers = await futureUtils.setUpComponentList();
  });

  // ----------------------------- REQUIRED FOR CREATION ----------------------
  // Allowed time is 1 second in the period
  it('Create binary oraclized future', async () => {
    future = await OraclizedBinaryFuture.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,

      providers.tokens[0], // A token from Kyber
      futureData.investingPeriod,
    );


    await future.initialize(providers.componentList.address, futureData.feePercentage, futureData.maxAllowInterval);
    assert.equal((await future.status()).toNumber(), 1); // Active

    const longAddress = await future.getLongToken();
    const shortAddress = await future.getShortToken();

    longToken = new BinaryFutureToken(longAddress);
    shortToken = new BinaryFutureToken(shortAddress);


  });


  // ----------------------------- ORACLE FUNCTIONS ----------------------
  it('Oracle set price', async () => {

    const tx = await future.setOracleTargetPrice(futureData.defaultTargetPrice);
    assert.ok(tx);

    const now = new BigNumber(Date.now()).div(1000);


    const price = await future.getTargetPrice();
    const lastTimeUpdated = await future.lastTimeUpdated();

    assert(price.eq(futureData.defaultTargetPrice), 'Oracle set the price')
    assert.equal(now.toFixed(0), lastTimeUpdated.toFixed(0));

    await calc.assertReverts(async () => {
      await future.setOracleTargetPrice(futureData.defaultTargetPrice, { from: investorA });
    }, "Only owner can set the oracle");

  });
  // ----------------------------- END ORACLE FUNCTIONS ----------------------

  // ----------------------------- REVERT EXPIRED PRICE ----------------------
  it('Cant invest with expired price', async () => {

    let currentPeriod;
    let tx;
    const depositValue = 10 ** 16; // 0.00 ETH
    // Investment OK
    await future.setOracleTargetPrice(futureData.defaultTargetPrice);
    currentPeriod = await future.getCurrentPeriod();
    tx = await future.invest(FutureDirection.Long, currentPeriod, { from: investorA, value: depositValue });
    assert.ok(tx);

    // Wait 1 Second, cant invest
    calc.delay(1);

    currentPeriod = await future.getCurrentPeriod();
    await calc.assertReverts(async () => {
      await future.invest(FutureDirection.Long, currentPeriod, { from: investorA, value: depositValue });
    }, "Only owner can set the oracle");
  });

  it('Cant clear with expired price', async () => {

    const currentPeriod = await future.getCurrentPeriod();
    const depositValue = 10 ** 16; // 0.00 ETH

    // Price not expired

    await future.setOracleTargetPrice(futureData.defaultTargetPrice);
    // Need to be investor to clear
    await future.invest(FutureDirection.Long, currentPeriod, { value: depositValue });


    // Wait 2 Seconds to make clear enabled
    await calc.delay(2000);

    //Price is expired
    await calc.assertReverts(async () => {
      await future.clear(currentPeriod);
    }, "Cant clear with expired price");
    // Set the price
    await future.setOracleTargetPrice(futureData.defaultTargetPrice);
    const tx = await future.clear(currentPeriod);
    assert.ok(tx);
    // ----------------------------- END REVERT EXPIRED PRICE ----------------------
  });
});
