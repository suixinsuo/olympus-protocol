const {
  DerivativeProviders,
} = require("../utils/constants");
const BigNumber = web3.BigNumber;


const FutureContract = artifacts.require("FutureContractStub"); // FutureContract With functions for testing
const MockOracle = artifacts.require("MockOracle"); // FutureContract With functions for testing
const Marketplace = artifacts.require("Marketplace");
const Locker = artifacts.require("Locker");
const StepProvider = artifacts.require("StepProvider");
const PercentageFee = artifacts.require("PercentageFee");
const Reimbursable = artifacts.require("Reimbursable");
const ComponentList = artifacts.require("ComponentList");
const FutureToken = artifacts.require("FutureERC721Token");
const MockToken = artifacts.require("MockToken");
const MockKyberNetwork = artifacts.require("MockKyberNetwork");
const ExchangeProvider = artifacts.require("ExchangeProvider");
const {
  FutureDirection,
  DerivativeStatus,
} = require("../utils/constants");

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
  fee: 0,
};

async function estimateAllTokenBenefits(
  token,
  direction,
  ids,
  price,
  depositPercentage,
  delta,
  denominator) {
  price = new BigNumber(price);
  let winnerBalanceStack = new BigNumber(0);
  let winnerShareCount = 0;
  const values = await Promise.all(ids.map(async (id) => {
    const buyingPrice = await token.getBuyingPrice(id);
    const isWinnerToken = (price.gt(buyingPrice) && direction === FutureDirection.Long) ||
      (buyingPrice.gt(price) && direction === FutureDirection.Short);

    const absolutePriceDiff = buyingPrice.minus(price).abs();
    const tokenDeposit = await token.getDeposit(id);
    const benefit = absolutePriceDiff.times(tokenDeposit)
      .div(buyingPrice.times(depositPercentage).div(
        denominator));
    if (isWinnerToken) {
      winnerShareCount++;
      return benefit;
    }
    /**
     * if not as winner then benefit return 0;
     * winnerBalanceStack should be increased;
     */
    const isReachToOutToken = reachToOut(buyingPrice, price, delta, denominator);
    if (isReachToOutToken) {
      if (benefit.gt(tokenDeposit)) {
        winnerBalanceStack = winnerBalanceStack.plus(tokenDeposit);
      } else {
        winnerBalanceStack = winnerBalanceStack.plus(benefit);
      }
    }
    return new BigNumber(0);
  }));

  const total = values.reduce((a, b) => a.plus(b));
  return {
    total,
    winnerBalanceStack,
    winnerShareCount,
  };
}

async function reachToOut(buyingPrice, price, delta, denominator) {
  const absolutePriceDiff = buyingPrice.minus(price).abs();
  return delta.div(denominator).times(price).lt(absolutePriceDiff);
}

/**
 * estimateValue estimate how much can be redeem.
 * @param {*} future future
 * @param {*} direction long or short
 * @param {*} tokenId token id
 * @param {*} price price ie. 10 ** 18
 */
async function estimateValue(future, direction, tokenId, price) {
  const actValue = await future.getTokenActualValue(direction, tokenId, price);
  const tokenDeposit = await future.getTokenDeposit(direction, tokenId);
  // if action lower then deposit return actValue;
  if (actValue <= tokenDeposit) {
    return actValue;
  }

  const longAddress = await future.getLongToken();
  const shortAddress = await future.getShortToken();
  const delta = await future.forceClosePositionDelta();
  const denominator = await future.DENOMINATOR();
  const depositPercentage = await future.depositPercentage();

  longToken = new FutureToken(longAddress);
  shortToken = new FutureToken(shortAddress);
  const longValidTokenIds = await future.getValidTokens(FutureDirection.Long) || [];
  const shortValidTokenIds = await future.getValidTokens(FutureDirection.Short) || [];
  const longEstimated = await estimateAllTokenBenefits(
    longToken,
    FutureDirection.Long,
    longValidTokenIds,
    price,
    depositPercentage,
    delta,
    denominator);
  const shortEstimated = await estimateAllTokenBenefits(
    shortToken,
    FutureDirection.Short,
    shortValidTokenIds,
    price,
    depositPercentage,
    delta,
    denominator);

  const winnersBalance = await future.winnersBalance();
  /**
   * div winnersBalance as amount
   */
  // const total = longEstimated.total.plus(shortEstimated.total);
  // const benefit = winnersBalance.plus(longEstimated.winnerBalanceStack)
  //   .plus(shortEstimated.winnerBalanceStack)
  //   .times(actValue.minus(tokenDeposit)).div(total);
  const winnerTokenSupply = longEstimated.winnerShareCount + shortEstimated.winnerShareCount;
  const benefit = winnersBalance.plus(longEstimated.winnerBalanceStack)
    .plus(shortEstimated.winnerBalanceStack)
    .div(winnerTokenSupply);
  return benefit.plus(tokenDeposit);
}

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
    const percentageFee = await PercentageFee.deployed();
    const exchangeProvider = await ExchangeProvider.deployed();
    const componentList = await ComponentList.deployed();
    const mockOracle = await MockOracle.deployed();

    await reimbursable.setMotAddress(mockMOT.address);
    await exchangeProvider.setMotAddress(mockMOT.address);
    await percentageFee.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);
    componentList.setComponent(DerivativeProviders.STEP, stepProvider.address);
    componentList.setComponent(DerivativeProviders.FEE, percentageFee.address);
    componentList.setComponent(DerivativeProviders.ORACLE, mockOracle.address);
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

    const mockOracle = await MockOracle.deployed();
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
    await mockOracle.setMockTargetPrice(futureData.defaultTargetPrice);

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
  estimateValue,
}
