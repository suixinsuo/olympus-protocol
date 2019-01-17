const calc = require("../utils/calc");
const BigNumber = web3.BigNumber;

const {
  FutureDirection,
  DerivativeStatus,
} = require("../utils/constants");

const DENOMINATOR = 10000;
const utils = require("./futureUtils");
const FutureContract = artifacts.require("FutureContractStub");
const FutureToken = artifacts.require("FutureERC721Token");
const MockOracle = artifacts.require("MockOracle"); // FutureContract With functions for testing

const futureData = {
  name: "FutureTest",
  description: "FutureV1",
  symbol: 'FV1',
  category: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  target: 1,
  clearInterval: 2, // seconds
  amountOfTargetPerShare: 2,
  depositPercentage: 0.1 * DENOMINATOR, // 1000 DENOMINATOR, 10%
  forceClosePositionDelta: 0.8 * DENOMINATOR,
  ethDeposit: 0.11, // 'ETHER'
  maxSteps: 10, // hard coded in the derivative
  defaultTargetPrice: 10 ** 18,
  fee: 0,
}

contract("Test Future MVP Redeem", accounts => {
  let future;
  let providers;
  let mockOracle;

  const groupA = accounts.slice(1, 11);
  const groupB = accounts.slice(11, 21);
  const groupAll = accounts.slice(1, 21);


  before("Initialize ComponentList", async () => {
    assert(accounts.length >= 21, "Require at least 11 investors for this test case");
    providers = await utils.setUpComponentList();
    mockOracle = await MockOracle.deployed();
  });


  it("1. redeem before invest.", async () => {
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
    const amountsOfShares = 2;
    const investmentMargin = 1;

    // await calc.assertReverts(async () => {
    //   await utils.estimateValue(future, FutureDirection.Short, 1, 10 ** 18);
    //   // await utils.estimateValue(future,FutureDirection.Short, 1, 10 ** 18);
    // }, "Shall revert");

    // await future.initialize(providers.componentList.address, futureData.clearInterval, {
    //   value: web3.toWei(futureData.ethDeposit, "ether")
    // });

    // await utils.estimateValue(future, FutureDirection.Long, 1, 10 ** 18).then((value) => {
    //   assert.equal(0, +value, 'should be return 0');
    // });

    // // set mock price 1 ETH.
    // await mockOracle.setMockTargetPrice(10 ** 18);
    // // account 1 invest( -1, 2);
    // await utils.safeInvest(future, FutureDirection.Long, amountsOfShares, accounts[1],
    //   investmentMargin);
    // // account 2 invest( 1, 2).
    // await utils.safeInvest(future, FutureDirection.Short, amountsOfShares, accounts[2],
    //   investmentMargin);
    // // estimateValue(1, 1, 100000000000000000), should be return 0.2ETH, 
    // await utils.estimateValue(future, FutureDirection.Long, 1, 10 ** 18).then((value) => {
    //   assert.equal(0.2 * 10 ** 18, +value, 'should be return 0.2ETH');
    // });
    // // estimateValue(-1, 1, 100000000000000000), should be return 0.2ETH, 
    // await utils.estimateValue(future, FutureDirection.Short, 1, 10 ** 18).then((value) => {
    //   assert.equal(0.2 * 10 ** 18, +value, 'should be return 0.2ETH');
    // });

    // await mockOracle.setMockTargetPrice(0.91 * 10 ** 18);
    // // estimateValue(1, 1, 100000000000000000), should be return 0.2ETH, 
    // await utils.estimateValue(future, FutureDirection.Short, 1, 10 ** 18).then((value) => {
    //   assert.equal(0.2 * 10 ** 18, +value, 'should be return 0.2ETH');
    // });
    // // estimateValue(1, 1, 91000000000000000), should be return 0.2ETH, 
    // await utils.estimateValue(future, FutureDirection.Short, 1, 0.91 * 10 ** 18).then((value) => {
    //   // console.log('should be return 0.38ETH', +value);
    //   assert.equal(0.38 * 10 ** 18, +value, 'should be return 0.38ETH');
    // });
    // await utils.estimateValue(future, FutureDirection.Short, 1, 0.90 * 10 ** 18).then((value) => {
    //   // console.log('should be return 0.38ETH', +value);
    //   assert.equal(0.4 * 10 ** 18, +value, 'should be return 0.4ETH');
    // });
    // // estimateValue(-1, 1, 100000000000000000), should be return 0.2ETH, 
    // await utils.estimateValue(future, FutureDirection.Long, 1, 10 ** 18).then((value) => {
    //   assert.equal(0.2 * 10 ** 18, +value, 'should be return 0.2ETH');
    // });
  });


});
