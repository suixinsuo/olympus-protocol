const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  ethToken,
  DerivativeStatus,
  DerivativeType
} = require("../utils/constants");

const FutureContract = artifacts.require("FutureContract");
const Marketplace = artifacts.require("Marketplace");
const Locker = artifacts.require("Locker");
const Reimbursable = artifacts.require("Reimbursable");
const ComponentList = artifacts.require("ComponentList");

const MockToken = artifacts.require("MockToken");


const futureData = {
  name: "Future Test",
  description: "Sample of future mvp",
  version: 'v0.2',
  target: 1,
  clearInterval: 1, // seconds
  amountOfTargetPerShare: 2,
  depositPercentage: 0.1 * 1000, // 1000 DENOMINATOR
  maxDepositLost: 0.8 * 1000,
  ethDeposit: 0.1, // 'ETHER'
};



contract("Basic Future", accounts => {

  let future;
  let market;
  let mockMOT;
  let locker;
  let reimbursable;
  let componentList;

  const investorA = accounts[1];
  const investorB = accounts[2];


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

      futureData.target,
      mockMOT.address,
      futureData.amountOfTargetPerShare,

      futureData.depositPercentage,
      futureData.maxDepositLost
    );


    assert.equal((await future.status()).toNumber(), 0); // new

    await future.initialize(componentList.address, futureData.clearInterval, {
      value: web3.toWei(futureData.ethDeposit, "ether")
    });
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], future.address);
    assert.equal((await future.status()).toNumber(), 1); // Active
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
    assert.equal(await future.version(), "v0.1");
    assert.equal(await future.getTarget(), futureData.target);
    assert.equal(await future.getTargetAddress(), mockMOT.address);
    assert.equal(await future.getDepositPercentage(), futureData.depositPercentage);
    assert.equal((await future.getAmountOfTargetPerShare()).toNumber(), futureData.amountOfTargetPerShare);
    assert.equal((await future.maxDepositLost()).toNumber(), futureData.maxDepositLost);
    assert.equal((await future.getDeliveryDate()).toNumber(), futureData.clearInterval);



  });
  // --------------------------------------------------------------------------


});
