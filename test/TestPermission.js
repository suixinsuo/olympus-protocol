'use strict'
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
// const Web3 = require('web3');
// const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');

const ROLE_ADMIN = "admin";
const ROLE_CORE = "core";
const ROLE_STORAGE = "storage";
const ROLE_CORE_OWNER = "CoreOwner";
const ROLE_STRATEGY_OWNER = "StrategyOwner";
const ROLE_PRICE_OWNER = "PriceOwner";
const ROLE_EXCHANGE_OWNER = "ExchangeOwner";
const ROLE_EXCHANGE_ADAPTER_OWNER = "ExchangeAdapterOwner";
const ROLE_STORAGE_OWNER = "StorageOwner";
const ROLE_WHITELIST_OWNER = "WhitelistOwner";

contract('Olympus-Protocol-permission', (accounts) => {

  it("They should be able to deploy.", () => {
    return Promise.all([
      PermissionProvider.deployed(),
    ]).spread((/*permission*/ core) => {
      assert.ok(core, 'Permission contract is not deployed.');
    });
  });

  it("Should be able to create an admin.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.has.call(accounts[0], ROLE_ADMIN);

    assert.equal(result, true);
  })

  it("Should be able to create a role.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[1], ROLE_STRATEGY_OWNER, { from: accounts[0] });
    let resHasRole = await instance.has.call(accounts[1], ROLE_STRATEGY_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a role.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[1], ROLE_STRATEGY_OWNER, { from: accounts[0] });
    let resHasRole = await instance.has.call(accounts[1], ROLE_STRATEGY_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to check a role.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let resHasRole = await instance.has.call(accounts[0], ROLE_ADMIN);
    // Should be true, because we deployed the permission provider, so we are admin.
    assert.equal(resHasRole, true);
  })

  it("Should be able to create a core owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[1], ROLE_CORE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[1], ROLE_CORE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a core owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[1], ROLE_CORE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[1], ROLE_CORE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to create a strategy owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[1], ROLE_STRATEGY_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[1], ROLE_STRATEGY_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a strategy owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[1], ROLE_STRATEGY_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[1], ROLE_STRATEGY_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to create a price owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[2], ROLE_PRICE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[2], ROLE_PRICE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a price owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[2], ROLE_PRICE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[2], ROLE_PRICE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to create a exchange owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[3], ROLE_EXCHANGE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[3], ROLE_EXCHANGE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a exchange owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[3], ROLE_EXCHANGE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[3], ROLE_EXCHANGE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to create a storage owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[4], ROLE_STORAGE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[4], ROLE_STORAGE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a storage owner.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[4], ROLE_STORAGE_OWNER, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[4], ROLE_STORAGE_OWNER);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })

  it("Should be able to create a storage.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminAdd(accounts[4], ROLE_STORAGE, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[4], ROLE_STORAGE);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, true);
  })

  it("Should be able to remove a storage.", async () => {
    let instance = await PermissionProvider.deployed({ from: accounts[0] });
    let result = await instance.adminRemove(accounts[4], ROLE_STORAGE, { from: accounts[0] });

    let resHasRole = await instance.has.call(accounts[4], ROLE_STORAGE);

    assert.equal(result.receipt.status, 1);
    assert.equal(resHasRole, false);
  })
});
