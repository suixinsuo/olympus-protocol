


const binaryFutureData = {
  name: "Binary Future Test",
  description: "Sample of future mvp",
  symbol: 'BFT',
  category: 'General',
  maxSteps: 10, // hardcoded in the derivative
  defaultTargetPrice: 10 ** 18 * 1000,
  investingPeriod: 1, // seconds, enough for 1 test case
};

const oraclizedData = {
  ...binaryFutureData,
  maxAllowInterval: 1, // seconds, enough for 1 test case
}

module.exports = {

  binaryFutureData,
  oraclizedData,

  investBinarySeveral: async (future, investors, period, direction, totaInvestment, weights) => {
    for (let i = 0; i < investors.length; i++) {
      await future.invest(direction, period,
        { from: investors[i], value: totaInvestment.mul(weights[i]) }
      );
    }
  },
  getClearData: async (future, period) => {
    const winnersBalance = await future.winnersBalances(period);
    const winnersInvestment = await future.winnersInvestment(period);
    const winnersBalanceRedeemed = await future.winnersBalancesRedeemed(period);
    const clearFinish = await future.tokensCleared(period);
    return { winnersBalance, winnersInvestment, winnersBalanceRedeemed, clearFinish };

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

  getRewardAmountForBinaryFuture: async (future, winnersBalance) => {
    let reward = winnersBalance.mul(await future.REWARDS_PERCENTAGE()).div(await future.DENOMINATOR());
    const min_reward = await future.MIN_REWARDS();
    const max_reward = await future.MAX_REWARDS();
    if (reward.lt(min_reward)) reward = min_reward;
    if (reward.gt(max_reward)) reward = max_reward;

    return reward;
  },
}
