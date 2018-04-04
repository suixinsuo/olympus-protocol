'use strict'
const Strategy = artifacts.require("../contracts/strategy/StrategyProvider.sol");

const _ = require('lodash');
const Promise = require('bluebird');

contract('Olympus-Protocol-strategy', (accounts) => {
  it("They should be able to deploy.", function() {
    return Promise.all([
      // Price.deployed(),
      Strategy.deployed(),
      // Exchange.deployed(),
    ])
    .spread((/*price, strategy, exchange,*/ core) =>  {
      assert.ok(core, 'Core contract is not deployed.');
    });
  });
});