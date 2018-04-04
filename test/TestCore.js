const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
// const Price = artifacts.require("../contracts/price/PriceProvider.sol");
// const Strategy = artifacts.require("../contracts/strategy/StrategyProvider.sol");
// const Exchange = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const _ = require('lodash');
const Promise = require('bluebird');

contract('Olympus-Protocol', function(accounts) {
  it("They should be able to deploy.", function() {
    return Promise.all([
      // Price.deployed(),
      // Strategy.deployed(),
      // Exchange.deployed(),
      Core.deployed(),
    ])
    .spread((/*price, strategy, exchange,*/ core) =>  {
      assert.ok(core, 'Core contract is not deployed.');
    });
  });
});