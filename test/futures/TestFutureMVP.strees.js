const calc = require("../utils/calc");
const BigNumber = web3.BigNumber;

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
 
 

});
