'use strict';

const RiskControl = artifacts.require("../contracts/components/RiskControl");
const Promise = require('bluebird');

contract('RiskControl', (accounts) => {

    it("RiskControl should be able to deploy.", async () => {
        return await Promise.all([
          RiskControl.deployed(),
        ]).spread((/*RiskControl*/ core) => {
            assert.ok(core, 'RiskControl contract is not deployed.');
          });
      });
    
    it("RiskControl should be able to return false.", async () => {
        let instance = await RiskControl.deployed();
        let result = await instance.hasRisk(accounts[0], accounts[1], "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", web3.toWei(1), 10 ** 18);
        assert.equal(result, false);
    })
});
