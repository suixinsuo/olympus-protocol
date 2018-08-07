// Constants
module.exports = {
  ethToken: "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",

  DerivativeStatus: { New: 0, Active: 1, Paused: 2, Closed: 3 },
  DerivativeType: { Index: 0, Fund: 1 },
  WhitelistType: { Investment: 0, Maintenance: 1 },

  DerivativeProviders: {
    MARKET: "MarketProvider",
    PRICE: "PriceProvider",
    EXCHANGE: "ExchangeProvider",
    WITHDRAW: "WithdrawProvider",
    RISK: "RiskProvider",
    WHITELIST: "WhitelistProvider",
    FEE: "FeeProvider",
    REIMBURSABLE: "Reimbursable",
    REBALANCE: "RebalanceProvider",
    STEP: "StepProvider",
    LOCKER: "LockerProvider",
    GETETH: "GetEth",
    TOKENBROKEN: "TokenBroken",
  }
};
