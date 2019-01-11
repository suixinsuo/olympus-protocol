const BinaryFuture = artifacts.require('BinaryFutureStub');
const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');
const MockOracle = artifacts.require("MockOracle");

const binaryFutureData = {
  name: "Binary Future Test",
  description: "Sample of future mvp",
  symbol: 'BFT',
  category: 'General',
  maxSteps: 10, // hard coded in the derivative
  defaultTargetPrice: 10 ** 18 * 1000,
  investingPeriod: 1, // seconds, enough for 1 test case
  feePercentage: 0,
  disabledValue: 1,
};

/** 
  1. Create a Binary Future by deploying the BinaryFutureStub contract.
  Deploy with the following parameters:
  "Binary Future Stress Test Multi",
  "A binary future stub contract to test stress cases with investments into multiple direction" ,
  "BFSTM",
  "0x42696e617279467574757265537472657373",
  "TOKEN_ADDRESS",
  60
*/

const binaryFutureStressData = {
  name: "Binary Future Stress Test",
  description: "A binary future stub contract to test stress cases",
  symbol: 'BFST',
  category: 'BinaryFutureStress',
  maxSteps: 10, // hard coded in the derivative
  defaultTargetPrice: 10 ** 18 * 1000,
  originTargetPrice: 10 ** 18,
  investingPeriod: 1, // seconds, enough for 1 test case
  feePercentage: 0,
  disabledValue: 1,
};

const oraclizedData = {
  ...binaryFutureData,
  maxAllowInterval: 1, // seconds, enough for 1 test case
}

async function createDefaultBinaryFuture(
  componentList,
  targetAddress,
) {

  const {
    name,
    description,
    symbol,
    category,
    investingPeriod,
    feePercentage,
  } = binaryFutureData;

  const future = await BinaryFuture.new(
    name,
    description,
    symbol,
    category,
    targetAddress,
    investingPeriod,
  );

  await future.initialize(componentList.address, feePercentage);

  const longAddress = await future.getLongToken();
  const shortAddress = await future.getShortToken();

  longToken = new BinaryFutureToken(longAddress);
  shortToken = new BinaryFutureToken(shortAddress);
  return {
    future,
    longToken,
    shortToken
  };
}

module.exports = {
  createDefaultBinaryFuture,
  binaryFutureStressData,
  binaryFutureData,
  oraclizedData,
  investBinarySeveral: async (future, investors, period, direction, totaInvestment, weights) => {
    for (let i = 0; i < investors.length; i++) {
      await future.invest(direction, period, {
        from: investors[i],
        value: totaInvestment.mul(weights[i])
      });
    }
  },
  getClearData: async (future, period) => {
    const winnersBalance = await future.winnersBalances(period);
    const winnersInvestment = await future.winnersInvestment(period);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(period);
    const clearFinish = await future.tokensCleared(period);
    return {
      winnersBalance,
      winnersInvestment,
      winnersBalanceRedeemed,
      clearFinish
    };

  },

  checkTokensInvalid: async (binaryToken, period) => {
    const longInvestedTokens = await binaryToken.getTokensByPeriod(period);
    for (let i = 0; i < longInvestedTokens.length; i++) {
      assert.notOk(await binaryToken.isTokenValid(longInvestedTokens[i]))
    }
  },

  checkLosersRedeemBalance: async (future, losers) => {
    for (let i = 0; i < losers.length; i++) {
      const redeemBalance = await future.userRedeemBalance(losers[i]);
      assert(redeemBalance.eq(0), `Investor ${i} has nothing to rebalance`)
    }
  },
  getClearRewardFromLogEvent(clearTx) {
    const event = clearTx.logs.find(log => log.event === 'CallerRewarded');
    if (event === undefined) {
      return 0;
    }
    return event.args._amount;
  },
  estimateRewardAmountForBinaryFuture: async (future, allLostValues) => {
    let reward = allLostValues.mul(await future.REWARDS_PERCENTAGE()).div(await future.DENOMINATOR());
    const min_reward = await future.MIN_REWARDS();
    const max_reward = await future.MAX_REWARDS();
    if (reward.lt(min_reward)) reward = min_reward;
    if (reward.gt(max_reward)) reward = max_reward;

    return reward;
  },
}
