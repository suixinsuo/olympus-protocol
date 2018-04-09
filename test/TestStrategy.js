'use strict'
const Strategy = artifacts.require("../contracts/strategy/StrategyProvider.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const mockData = { 
    id: 0,
    name: "test",
    description: "test strategy",
    category: "multiple",
    tokenAddresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af","0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
    weights: [80,20],
    follower: 0,
    amount: 0,
    exchangeId: "0x0000000000000000000000000000000000000000000000000000000000000000" 
}
contract('Olympus-Protocol-strategy', (accounts) => {
  
    it("They should be able to deploy.", () => {
        return Promise.all([
        // Price.deployed(),
        Strategy.deployed(),
        // Exchange.deployed(),
    ]).spread((/*price, strategy, exchange,*/ core) =>  {
        assert.ok(core, 'Strategy contract is not deployed.');
        });
    });

    it("Should be able to create a strategy.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.createStrategy(mockData.name, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.exchangeId, {from:accounts[0]});
        assert.equal(result.receipt.status, '0x01');
    })

    it("Should be able to get a strategy.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getStrategy(0);

        assert.equal(result[0].toNumber(), 0);                                            //asert id
        assert.equal(web3.toAscii(result[1]).replace(/\0/g, ''), mockData.name);          //asert name
        assert.equal(web3.toAscii(result[2]).replace(/\0/g, ''), mockData.description);   //asert description
        assert.equal(web3.toAscii(result[3]).replace(/\0/g, ''), mockData.category);      //asert category
        assert.equal(result[4].toNumber(), mockData.follower);                            //asert follower
        assert.equal(result[5].toNumber(), mockData.amount);                              //asert amount
        assert.equal(result[6], mockData.exchangeId);                                     //asert exchangeId
    })

    it("Should be able to get strategies.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getStrategies(accounts[0]);

        assert.equal(result[0].toNumber(), 0);                                            //asert id
    })

    it("Should be able to get my strategies.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getMyStrategies({from: accounts[0]});

        assert.equal(result[0].toNumber(), 0);                                            //asert id
    })

    it("Should be able to get strategy token by index.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getStrategyTokenByIndex(0,0);

        assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[0].toLowerCase());                              //token
        assert.equal(result[1].toNumber(), mockData.weights[0]);                          //weight
    })

    it("Should be able to get strategy token count by index.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getStrategyTokenCount(0);

        assert.equal(result.toNumber(), 2);                          //token length
    })

    it("Should be able to get strategy count.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.getStrategyCount();

        assert.equal(result.toNumber(), 1);                          //strategy count
    })

    it("Should be able to update strategy.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.updateStrategy(0, "update name", "update desc", "update category", ["0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0", "0xd26114cd6ee289accf82350c8d8487fedb8a0c07"], [30,70], web3.toAscii('testExchange'));

        assert.equal(result.receipt.status, '0x01');        // assert.equal(result, true);                          
    })

    it("Should be able to increment amount.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.incrementStatistics(0, 10);

        assert.equal(result.receipt.status, '0x01');        // assert.equal(result, true);      
    })

});
