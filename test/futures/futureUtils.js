const {
  DerivativeProviders,
} = require("../utils/constants");
const BigNumber = web3.BigNumber;


const FutureContract = artifacts.require("FutureContractStub"); // FutureContract With functions for testing
const Marketplace = artifacts.require("Marketplace");
const Locker = artifacts.require("Locker");
const StepProvider = artifacts.require("StepProvider");

const Reimbursable = artifacts.require("Reimbursable");
const ComponentList = artifacts.require("ComponentList");
const FutureToken = artifacts.require("FutureERC721Token");
const MockToken = artifacts.require("MockToken");
const MockKyberNetwork = artifacts.require("MockKyberNetwork");
const ExchangeProvider = artifacts.require("ExchangeProvider");


const DENOMINATOR = 10000;
const INITIAL_FEE = 10 ** 17;
const futureData = {
  name: "Future Test",
  description: "Sample of future mvp",
  symbol: 'FTK',
  category: 'General',
  target: 1,
  clearInterval: 2, // seconds
  amountOfTargetPerShare: 2,
  depositPercentage: 0.1 * DENOMINATOR, // 1000 DENOMINATOR, 10%
  forceClosePositionDelta: 0.8 * DENOMINATOR,
  ethDeposit: 0.1, // 'ETHER'
  maxSteps: 10, // hard coded in the derivative
  defaultTargetPrice: 10 ** 18,
};
module.exports = {

  futureData,
  DENOMINATOR,
  INITIAL_FEE,

  setUpComponentList: async () => {

    const market = await Marketplace.deployed();
    const mockMOT = await MockToken.deployed();
    const locker = await Locker.deployed();
    const reimbursable = await Reimbursable.deployed();
    const stepProvider = await StepProvider.deployed();
    const mockKyber = await MockKyberNetwork.deployed();
    const exchangeProvider = await ExchangeProvider.deployed();
    const componentList = await ComponentList.deployed();

    await reimbursable.setMotAddress(mockMOT.address);
    await exchangeProvider.setMotAddress(mockMOT.address);


    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);
    componentList.setComponent(DerivativeProviders.STEP, stepProvider.address);
    componentList.setComponent(DerivativeProviders.EXCHANGE, exchangeProvider.address);

    const tokens = (await mockKyber.supportedTokens())
    return {
      componentList,
      exchangeProvider,
      market,
      mockMOT,
      locker,
      reimbursable,
      stepProvider,
      tokens
    };
  },
  /**
   * Creates a future which default data
   * @param {*} componentList
   * @param {*} targetAddress
   * @returns {future, longToken, shortToken}
   */
  createDefaultFuture: async (componentList, targetAddress, {
    clearInterval,
    depositPercentage,
    amountOfTargetPerShare,
  } = {
      clearInterval: undefined,
      depositPercentage: 0,
      amountOfTargetPerShare: 0
    }) => {

    const future = await FutureContract.new(
      futureData.name,
      futureData.description,
      futureData.symbol,
      futureData.category,
      futureData.target,
      targetAddress,
      amountOfTargetPerShare || futureData.amountOfTargetPerShare,
      depositPercentage || futureData.depositPercentage,
      futureData.forceClosePositionDelta
    );

    const interval = (clearInterval === undefined) ? futureData.clearInterval :
      clearInterval;

    await future.initialize(componentList.address, interval, {
      value: web3.toWei(futureData.ethDeposit, "ether")
    });

    const longAddress = await future.getLongToken();
    const shortAddress = await future.getShortToken();

    longToken = new FutureToken(longAddress);
    shortToken = new FutureToken(shortAddress);

    // Config for the stub
    await future.setTimeInterval(DerivativeProviders.CHECK_POSITION, 0);
    await future.setTargetPrice(futureData.defaultTargetPrice);

    return {
      future,
      longToken,
      shortToken
    };
  },
  calculateShareDeposit: (_amountOfShares, price) => {

    return new BigNumber(_amountOfShares).mul(futureData.amountOfTargetPerShare).mul(price).mul(futureData.depositPercentage)
      .div(DENOMINATOR).toNumber();
  },
  // Actual Value
  getTokenActualValue: (direction, deposit, startPrice, currentPrice) => {
    const pricePercentage = new BigNumber(startPrice).minus(currentPrice).div(startPrice).mul(new BigNumber(
      DENOMINATOR).div(futureData.depositPercentage));
    return new BigNumber(direction).mul(deposit).mul(pricePercentage).add(deposit).toNumber();
  },
  getStepStatus: async (future, stepProvider, category) => {
    return (await stepProvider.status(future.address, category)).toNumber();
  },
  safeInvest: async (future, direction, amountsOfShares, investor, margin = 1) => {
    const targetPrice = await future.getTargetPrice(); // Big Number
    const depositValue = (await future.calculateShareDeposit(amountsOfShares, targetPrice)); // Big Number
    tx = await future.invest(direction, amountsOfShares, {
      from: investor,
      value: depositValue.times(margin).toString()
    });
    return tx;
  },
  safeCheckPosition: async (future) => {
    let tx;
    while (!(await future.checkPosition.call())) {
      tx = await future.checkPosition();
    }
    tx = await future.checkPosition();
    return tx;
  },
  safeClear: async (future) => {
    let tx;
    while (!(await future.clear.call())) {
      tx = await future.clear();
    }
    tx = await future.clear();
    return tx;
  },
  /**
   * @param token Token to get the list
   * @param investor If investor is null will provided all tokens list.
   */
  validTokens: async (token, investor = null) => {
    if (investor == null) {
      return (await token.getValidTokens()).map((id) => id.toNumber());
    }
    return (await token.getValidTokenIdsByOwner(investor)).map((id) => id.toNumber());
  },

}
