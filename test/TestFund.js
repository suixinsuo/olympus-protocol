'use strict'
const TokenizationProvider = artifacts.require("../contracts/Tokenization/TokenizationProvider.sol");
const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const mockData = {
  id: 0,
  name: "test",
  symbol: "t",
  limittotalsupply: 1000,
  unlimittotalsupply : 0,
  description: "test strategy",
  category: "multiple",
  tokenAddresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  weights: [80, 20],
  follower: 0,
  withdrawCycle : 1,
  amount: 0,
  exchangeId: "0x0000000000000000000000000000000000000000000000000000000000000000"
}
contract('TokenizationProvider', (accounts) => {

  it("They should be able to deploy.", () => {
    return Promise.all([
      Core.deployed(),
      TokenizationProvider.deployed(),
    ]).spread((/*price, strategy, exchange,*/ core) => {
      assert.ok(core, 'TokenizationProvider contract is not deployed.');
    });
  });

  it("Should be able to create a Fund with no limit.", async () => {
    let instance = await TokenizationProvider.deployed();
    let result = await instance.createFund(mockData.name,mockData.symbol, mockData.unlimittotalsupply, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.withdrawCycle,0, { from: accounts[0] });
    
    assert.equal(result.receipt.status, '0x01');
  })
  it("Should be able to create a Fund with limit.", async () => {
    let instance = await TokenizationProvider.deployed();
    let result = await instance.createFund(mockData.name,mockData.symbol, mockData.limittotalsupply, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.withdrawCycle,0, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })
  it("Should be able to get a fund address.", async () => {
    let instance = await TokenizationProvider.deployed();
    let fundaddress1 = await instance.getFundAddress(0);
    let fundaddress2 = await instance.getFundAddress(1);
    console.log(fundaddress1,fundaddress2);
    assert.equal(fundaddress1.receipt.status, '0x01');
    assert.equal(fundaddress2.receipt.status, '0x01');
  })
});
