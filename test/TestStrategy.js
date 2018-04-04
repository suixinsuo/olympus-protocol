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
        assert.ok(core, 'Core contract is not deployed.');
        });
    });

    it("Should be able to create a strategy.", async () => {
        let instance  = await Strategy.deployed();
        let result = await instance.createStrategy(mockData.name, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.exchangeId);
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


});