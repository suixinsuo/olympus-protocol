'use strict'

/*
contract OlympusStorageExtendedInterface {
  function setCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key, bytes32 value) external returns(bool success);
  function getCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key) external view returns(bytes32 result);
  function getAccessor(bytes32 dataKind, uint id) private pure returns(string accessor);
  function bytes32ToString(bytes32 value) private pure returns(string result);
}
*/

const OlympusStorageExtended = artifacts.require("../contracts/storage/OlympusStorageExtended.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const TX_OK = '0x01';
const mockData = {
  type: 'Order',
  id: 1,
  key: 'key',
  value: 'value',
};
const mockDataAlternative = {
  type: 'Strategy',
  id: 1,
  key: 'keyStrategy',
  value: 'valueStrategy',
}
const finalOverrideValue = 'overridden';

contract('OlympusStorageExtended', (accounts) => {

  it("Should be able to deploy.", () => {
    return Promise.all([
      OlympusStorageExtended.deployed()
    ]).spread((storageExtended) => {
      assert.ok(storageExtended, 'OlympusStorageExtended contract is not deployed.');
    });
  });

  it("Should be able to set a custom value.", async () => {
    let instance = await OlympusStorageExtended.deployed();
    // let result = await instance.setCustomExtraData(mockData.type, mockData.id, mockData.key, mockData.value, { from: accounts[0] });
    // assert.equal(result.receipt.status, '0x01');
    let result = await instance.setCustomExtraData.call(
      mockData.type, mockData.id, mockData.key, mockData.value, { from: accounts[0] });
    let transactionResult = await instance.setCustomExtraData(
      mockData.type, mockData.id, mockData.key, mockData.value, { from: accounts[0] });
    assert.equal(result, true);
    assert.equal(transactionResult.receipt.status, TX_OK);
  });

  it("Should be able to get a custom value.", async () => {
    try {
      let instance = await OlympusStorageExtended.deployed();
      let result = await instance.getCustomExtraData.call(mockData.type, mockData.id, mockData.key);
      assert.equal(web3.toAscii(result).replace(/\0/g, ''), mockData.value);
    } catch (e) {
      console.error(e);
    }
  });

  it("Should not override different dataType with same ID", async () => {
    try {
      let instance = await OlympusStorageExtended.deployed();
      let setResult = await instance.setCustomExtraData.call(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, mockDataAlternative.value,
        { from: accounts[0] });
      let setTransactionResult = await instance.setCustomExtraData(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, mockDataAlternative.value,
        { from: accounts[0] });
      assert.equal(setResult, true);
      assert.equal(setTransactionResult.receipt.status, TX_OK);

      let resultMockData = await instance.getCustomExtraData.call(mockData.type, mockData.id, mockData.key, { from: accounts[0] });
      assert.equal(web3.toAscii(resultMockData).replace(/\0/g, ''), mockData.value);
      let resultMockDataAlternative = await instance.getCustomExtraData.call(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, { from: accounts[0] });
      assert.equal(web3.toAscii(resultMockDataAlternative).replace(/\0/g, ''), mockDataAlternative.value);
    } catch (e) {
      console.error(e);
    }
  });

  it("Should override if setCustomData is called again", async () => {
    try {
      let instance = await OlympusStorageExtended.deployed();
      let setResult = await instance.setCustomExtraData.call(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, finalOverrideValue,
        { from: accounts[0] });
      let setTransactionResult = await instance.setCustomExtraData(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, finalOverrideValue,
        { from: accounts[0] });
      assert.equal(setResult, true);
      assert.equal(setTransactionResult, TX_OK);
      let resultMockData = await instance.getCustomExtraData.call(
        mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, { from: accounts[0] });
      assert.equal(web3.toAscii(resultMockData).replace(/\0/g, ''), finalOverrideValue);
    } catch (e) {
      console.error(e);
    }

  });

});
