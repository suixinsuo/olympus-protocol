'use strict';

// const log = require('../utils/log');
const MockMarketClient = artifacts.require("MockMarketClient");
const MarketplaceProvider = artifacts.require("Marketplace");

const MockIndex = artifacts.require("MockIndex");
const SimpleERC20Token = artifacts.require("SimpleERC20Token");


const Promise = require('bluebird');
let mockIndexData = {
    decimals: 18,
    description: "this is test index description",
    category: "test",
    isRebalance: false,
    tokens: [0xd332692cf20cbc3aa39abf2f2a69437f22e5beb9,0x402d3bf5d448871810a3ec8a33fb6cc804f9b26e],
    weights: [20, 80]
}

contract('MockIndex', (accounts) => {
    let instance;
    before('Mock Index Test', async () => {
        instance = await MockIndex.new(mockIndexData.decimals, mockIndexData.description, mockIndexData.category, mockIndexData.isRebalance, mockIndexData.tokens, mockIndexData.weights);
      });
    it("Should be able to new", async () => {
        let decimals = await instance.decimals(); 
        let description = await instance.description();
        let category = await instance.category();
        let isRebalance = await instance.isRebalance();
        let status = await instance.status();
        let totalSupply = await instance.totalSupply();

        assert.equal(decimals.toNumber(), mockIndexData.decimals);
        assert.equal(description.toString(), mockIndexData.description);
        assert.equal(category.toString(), mockIndexData.category);
        assert.equal(isRebalance, false);
        assert.equal(status, 1);
        assert.equal(totalSupply, 0);
    })
    it("Should be able to get price.", async () => {
        let result = await instance.getPrice();
        assert.equal(result, 10 ** 18);
    })
    it("Should be able to buy one token.", async () => {
        let erc20Token = await SimpleERC20Token.at(instance.address);

        let beforeTokenBalance = await erc20Token.balanceOf(accounts[0]);
        let beforeIndexEthBalance = await web3.eth.getBalance(instance.address);

        await instance.invest({from: accounts[0], value: web3.toWei(1)});
        
        let getTokenAmount = await erc20Token.balanceOf(accounts[0]) - beforeTokenBalance;
        let getIndexEth = await web3.eth.getBalance(instance.address).minus(beforeIndexEthBalance);
        let price = await instance.getPrice();
        let decimals = await instance.decimals(); 
        let exceptTokenAmount = getIndexEth.mul(price).mul(10 ** (decimals - 18)).div(10 ** 18);
        assert.equal(exceptTokenAmount, getTokenAmount)
    })
    it("Should be able to pause the index.", async () => {
        let beforeStatus = await instance.status();

        await instance.changeStatus(2);
        let status = await instance.status();
        assert.equal(beforeStatus, 1);
        assert.equal(status, 2);
    })
    it("Should be able to close the index.", async () => {
        let beforeStatus = await instance.status();

        await instance.changeStatus(3);
        let status = await instance.status();
        assert.equal(beforeStatus, 2);
        assert.equal(status, 3);
    })
});
