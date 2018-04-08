const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
const Strategy = artifacts.require("../contracts/strategy/StrategyProvider.sol");
// const Price = artifacts.require("../contracts/price/PriceProvider.sol");
// const Exchange = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
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

contract('Olympus-Protocol', function(accounts) {
  it("They should be able to deploy.", function() {
    return Promise.all([
      // Price.deployed(),
      Strategy.deployed(),
      // Exchange.deployed(),
      Core.deployed(),
    ])
    .spread((/*price, strategy, exchange,*/ core) =>  {
      assert.ok(core, 'Core contract is not deployed.');
    });
  });

  it("should be able to create a strategy.", async () => {
      let instance = await Strategy.deployed();
      let result = await instance.createStrategy(mockData.name, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.exchangeId, {from:accounts[0]});
      assert.equal(result.receipt.status, '0x01');
      console.log(instance.address);
  })

  it("should be able to set a strategy provider.", async () => {
      let instance = await Core.deployed();
      let strategyInstance = await Strategy.deployed();

      let result = await instance.setProvider(0,strategyInstance.address);
      assert.equal(result.receipt.status, '0x01');                                  
  })

  it("should be able to get a strategy count.", async () => {
      let instance = await Core.deployed();
      let result = await instance.getStrategyCount();
      assert.equal(result.toNumber(), 1);                                  
  })

  it("should be able to get a strategy by index.", async () => {
      let instance = await Core.deployed();
      let result = await instance.getStrategy(0);

      assert.equal(result[0], mockData.name);          //asert name
      assert.equal(result[1], mockData.description);   //asert description
      assert.equal(result[2], mockData.category);      //asert category
      assert.equal(result[3].toNumber(), mockData.follower);                            //asert follower
      assert.equal(result[4].toNumber(), mockData.amount);                              //asert amount
      assert.equal(result[5], '');                                     //asert exchangeId
      assert.equal(result[6].toNumber(), 2);                              //asert amount
  })

  it("should be able to get a getStrategyTokenAndWeightByIndex.", async () => {
      let instance = await Core.deployed();
      let result = await instance.getStrategyTokenAndWeightByIndex(0,0);

      assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[0].toLowerCase());          //asert name
      assert.equal(result[1].toNumber(), mockData.weights[0]);   //asert description

      result = await instance.getStrategyTokenAndWeightByIndex(0,1);

      assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[1].toLowerCase());          //asert name
      assert.equal(result[1].toNumber(), mockData.weights[1]);   //asert description
  })
});