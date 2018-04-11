'use strict'
/*
contract OlympusStorageInterface {
    function addTokenDetails(
        uint indexOrderId, address token, uint weight, uint estimatedPrice,
        uint dealtPrice,uint totalTokenAmount,uint completedTokenAmount) external;
    function addOrderBasicFields(
        uint strategyId,
        address buyer,
        uint amountInWei,
        uint feeInWei,
        bytes32 exchangeId) external returns (uint indexOrderId);
    function getOrderTokenCompletedAmount(
        uint _orderId,
        address _tokenAddress) external view returns (uint, uint);
    function getIndexOrder1(uint _orderId) external view returns(
        uint strategyId,
        address buyer,
        STD.OrderStatus status,
        uint dateCreated
        );
    function getIndexOrder2(uint _orderId) external view returns(
        uint dateCompleted,
        uint amountInWei,
        uint tokensLength,
        bytes32 exchangeId
        );
    function updateIndexOrderToken(
        uint _orderId,
        uint _tokenIndex,
        uint _actualPrice,
        uint _totalTokenAmount,
        uint _completedQuantity,
        ExchangeProviderInterface.MarketOrderStatus status) external;
    function getIndexToken(uint _orderId, uint tokenPosition) external view returns (address token);
    function updateOrderStatus(uint _orderId, STD.OrderStatus _status)
        external returns (bool success);
}
*/
const KyberConfig = require('../scripts/libs/kyber_config');
const OlympusStorage = artifacts.require("../contracts/storage/OlympusStorage.sol");
const Web3 = require('web3');
const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const mockData = {
  buyer: '0x0000000000000000000000000000000000000000000000000000000000000000',
  strategyId: 0,
  amountInWei: 1000000,
  feeInWei: 100000,
  dateCreated: 0,
  dateCompleted: 0,
  tokens: KyberConfig.kovan.tokens,
  weights: [80, 20],
  estimatedPrices: [1, 2],
  dealtPrices: [0, 0],
  totalTokenAmounts: [0, 0],
  completedTokenAmounts: [0, 0],
  subStatuses: [0, 0],
  status: 0,
  exchangeId: 'Kyber'
}

contract('OlympusStorage', (accounts) => {

  it("Should be able to deploy.", () => {
    return Promise.all([
      OlympusStorage.deployed()
    ]).spread((storage) => {
      assert.ok(storage, 'OlympusStorage contract is not deployed.');
    });
  });

  it("Should be able to add order basic fields.", async () => {
    let instance = await OlympusStorage.deployed();
    try {
      let result = await instance.addOrderBasicFields.call(
        mockData.strategyId, mockData.buyer,
        mockData.amountInWei, mockData.feeInWei,
        mockData.exchangeId,
        { from: accounts[0] });
      console.log('S: result', result.toNumber())
      let result1 = await instance.addOrderBasicFields.call(
        mockData.strategyId, mockData.buyer,
        mockData.amountInWei, mockData.feeInWei,
        mockData.exchangeId,
        { from: accounts[0] });
      console.log('S: result1', result1.toNumber())
      let result2 = await instance.addOrderBasicFields.call(
        mockData.strategyId, mockData.buyer,
        mockData.amountInWei, mockData.feeInWei,
        mockData.exchangeId,
        { from: accounts[0] });
      console.log('S: result2', result2.toNumber())

      //assert.equal(result.receipt.status, '0x01');
    } catch (error) {
      console.log(error);
    }

  });

  it("Should be able to add order token fields.", async () => {
  });

  it("Should be able to get order token completed amount", async () => {
  });

  it("Should be able to get order details", async () => {
  });

  it("Should be able to update order token", async () => {
  });

  it("Should be able to get index token", async () => {
  });

  it("Should be able to update order details", async () => {
  });

});
