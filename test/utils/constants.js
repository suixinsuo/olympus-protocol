// Constants
module.exports = {
  ethToken: "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",

  DerivativeStatus: { New: 0, Active: 1, Paused: 2, Closed: 3 },
  DerivativeType: { Index: 0, Fund: 1, Future: 2, BinaryFuture: 3 },
  WhitelistType: { Investment: 0, Maintenance: 1 },
  FutureDirection: { Long: -1, Short: 1 },
  MutexStatus: { AVAILABLE: 0, CHECK_POSITION: 1, CLEAR: 2 },

  CheckPositionPhases: { Initial: 0, LongTokens: 1, ShortTokens: 2 },
  ClearPositionPhases: { Initial: 0, CalculateLoses: 1, CalculateBenefits: 2 },
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
    BUYTOKENS: "BuyTokens",
    CHECK_POSITION: "CheckPosition",
    CLEAR: "Clear",
    ORACLE: "ChainlinkOracle",
  }
};
