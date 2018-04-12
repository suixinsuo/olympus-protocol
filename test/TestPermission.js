'use strict'
const Permission = artifacts.require("../contracts/rbac/PermissionControl.sol");
// const Web3 = require('web3');
// const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
contract('Olympus-Protocol-permission', (accounts) => {
  
    it("They should be able to deploy.", () => {
        return Promise.all([
        Permission.deployed(),
    ]).spread((/*permission*/ core) =>  {
        assert.ok(core, 'Psermission contract is not deployed.');
        });
    });

    it("should be able to create a admin.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.hasRole(accounts[0], "admin");

        assert.equal(result, true);
    })

    it("should be able to create a role.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminAddRole(accounts[1], "strategyOwner", {from:accounts[0]});
        let resHasRole = await instance.hasRole(accounts[1], "strategyOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, true);
    })

    it("should be able to remove a role.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminRemoveRole(accounts[1], "strategyOwner", {from:accounts[0]});
        let resHasRole = await instance.hasRole(accounts[1], "strategyOwner");
    
        assert.equal(result.receipt.status, 1);
        assert.equal(resHasRole, false);
    })

    it("should be able to check a role.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let resHasRole = await instance.checkRole(accounts[0], "admin");
   
        assert.equal(resHasRole.length, 0);
    })


    it("should be able to create a strategy owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminAddStrategyOwner(accounts[1], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[1], "StrategyOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, true);
    })

    it("should be able to remove a strategy owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminRemoveStrategyOwner(accounts[1], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[1], "StrategyOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, false);
    })

    it("should be able to create a price owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminAddPriceOwner(accounts[2], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[2], "PriceOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, true);
    })

    it("should be able to remove a price owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminRemovePriceOwner(accounts[2], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[2], "PriceOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, false);
    })

    it("should be able to create a exchange owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminAddExchangeOwner(accounts[3], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[3], "ExchangeOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, true);
    })

    it("should be able to remove a exchange owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminRemoveExchangeOwner(accounts[3], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[3], "ExchangeOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, false);
    })

    it("should be able to create a storage owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminAddStorageOwner(accounts[4], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[4], "StorageOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, true);
    })

    it("should be able to remove a storage owner.", async () => {
        let instance  = await Permission.deployed({from:accounts[0]});
        let result = await instance.adminRemoveStorageOwner(accounts[4], {from:accounts[0]});

        let resHasRole = await instance.hasRole(accounts[4], "StorageOwner");

        assert.equal(result.receipt.status, 1); 
        assert.equal(resHasRole, false);
    })
});
