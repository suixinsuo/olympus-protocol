'use strict'

/*
contract OlympusStorageExtendedInterface {
  function setCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key, bytes32 value) external returns(bool success);
  function getCustomExtraData(bytes32 dataKind, uint objectId, bytes32 key) external view returns(bytes32 result);
  function getAccessor(bytes32 dataKind, uint id) private pure returns(string accessor);
  function bytes32ToString(bytes32 value) private pure returns(string result);
}
*/

const OlympusStorage = artifacts.require("../contracts/storage/OlympusStorage.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');

contract('OlympusStorage', (accounts) => {

  it("Should be able to deploy.", () => {
    return Promise.all([
      OlympusStorage.deployed()
    ]).spread((storage) => {
      assert.ok(storage, 'OlympusStorage contract is not deployed.');
    });
  });

  it("Should be able to set a custom value.", async () => {
    let instance = await OlympusStorageExtended.deployed();
    let result = await instance.setCustomExtraData(mockData.type, mockData.id, mockData.key, mockData.value, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  });

  it("Should be able to get a custom value.", async () => {
    let instance = await OlympusStorageExtended.deployed();
    let result = await instance.getCustomExtraData(mockData.type, mockData.id, mockData.key);
    console.log('result', result);
    assert.equal(web3.toAscii(result).replace(/\0/g, ''), mockData.value);
  });

  it("Should not override different dataType with same ID", async () => {
    let instance = await OlympusStorageExtended.deployed();
    let setResult = await instance.setCustomExtraData(
      mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, mockDataAlternative.value,
      { from: accounts[0] });
    assert.equal(setResult.receipt.status, '0x01');
    let resultMockData = await instance.getCustomExtraData(mockData.type, mockData.id, mockData.key, { from: accounts[0] });
    assert.equal(web3.toAscii(resultMockData).replace(/\0/g, ''), mockData.value);
    let resultMockDataAlternative = await instance.getCustomExtraData(
      mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, { from: accounts[0] });
    assert.equal(web3.toAscii(resultMockDataAlternative).replace(/\0/g, ''), mockDataAlternative.value);
  });

  it("Should override if setCustomData is called again", async () => {
    let instance = await OlympusStorageExtended.deployed();
    let setResult = await instance.setCustomExtraData(
      mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, finalOverrideValue,
      { from: accounts[0] });
    assert.equal(setResult.receipt.status, '0x01');
    let resultMockData = await instance.getCustomExtraData(
      mockDataAlternative.type, mockDataAlternative.id, mockDataAlternative.key, { from: accounts[0] });
    assert.equal(web3.toAscii(resultMockData).replace(/\0/g, ''), finalOverrideValue);
  });

});
