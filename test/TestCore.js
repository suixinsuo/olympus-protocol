const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
const StrategyProvider = artifacts.require("../contracts/strategy/StrategyProvider.sol");
const PriceProvider = artifacts.require("../contracts/price/PriceProvider.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const TokenizationProvider = artifacts.require("../contracts/tokenization/TokenizationProvider.sol");

const OlympusStorage = artifacts.require("../contracts/storage/OlympusStorage.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");

const _ = require('lodash');
const Promise = require('bluebird');
const mockData = {
  tokensLenght: 2,
  id: 0,
  name: "test",
  description: "test strategy",
  category: "multiple",
  tokenAddresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  exchangesAddressHash: ["0x6269626f78", "0x1269626f78"],
  tokenOnePrice: [1000000, 20000],
  addresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  tokenTwoPrice: [3000000, 40000],
  weights: [80, 20],
  follower: 0,
  amount: 0,
  exchangeId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  minTradeFeeInWei: 2000000,
  maxTradeFeeInWei: 3000000
}

const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

const ROLE_CORE = "core";

contract('Olympus-Protocol', function (accounts) {
  let Permission;
  let storage;
  let mockKyber;
  let provider;
  let kyberExchange;
  before('setup test env', async () => {
    Permission = await PermissionProvider.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    mockData.addresses = await mockKyber.supportedTokens();
    mockData.tokenAddresses = await mockKyber.supportedTokens();
    provider = await PriceProvider.deployed();
    storage = await OlympusStorage.deployed();
    await provider.setKyber(mockKyber.address);

    let exchangeProvider = await ExchangeProvider.deployed();
    kyberExchange = await KyberNetworkExchange.deployed();
    // reserve
    await kyberExchange.send(web3.toWei(mockData.tokensLenght, 'ether'));
    let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
    // register kyber
    await exchangeAdapterManager.addExchange("kyber", kyberExchange.address);
    let instance = await Core.deployed();
    // register exchange callback
    await exchangeProvider.setCore(instance.address);
  })

  it("They should be able to deploy.", async () => {
    return await Promise.all([
      OlympusStorage.deployed(),
      PriceProvider.deployed(),
      StrategyProvider.deployed(),
      PermissionProvider.deployed(),
      Core.deployed(),
    ])
      .spread((/*price, strategy, exchange,*/ core) => {
        assert.ok(core, 'Core contract is not deployed.');
      });
  });

  it("Should be able to set a onlyCore.", async () => {

    let instance = await Core.deployed();
    let result = await PermissionProvider.deployed();
    let name = await result.adminAdd(instance.address, ROLE_CORE);

    assert.equal(name.receipt.status, '0x01');
  })

  //tokenization provider
  it("Should be able to set a tokenization provider.", async () => {
    let instance = await Core.deployed();
    let permissionInstance = await PermissionProvider.deployed();

    let tokenizationInstance = await TokenizationProvider.deployed();

    let result = await tokenizationInstance.TokenizationIndex(permissionInstance.address);
    assert.equal(result.receipt.status, '0x01');

    result = await instance.setProvider(6, tokenizationInstance.address);
    assert.equal(result.receipt.status, '0x01');
  })
  it("Should be able to create a fund.", async () => {
    // let instance = await Core.deployed();

    let tokenizationInstance = await TokenizationProvider.deployed();
    let result = await tokenizationInstance.createFund('test_fund', 'test', 18, 'test description', 'test_category', mockData.tokenAddresses, mockData.weights, 0,0);
    assert.equal(result.receipt.status, '0x01');
  })
  it("Should be able to get fund buy fund id 0.", async () => {
    // let instance = await Core.deployed();
    let tokenizationInstance = await TokenizationProvider.deployed();

    let result = await tokenizationInstance.getFundDetails.call(0);
    console.log(result);
    // assert.equal(result.receipt.status, '0x01');
  })
  //exchange init

  it("Should be able to set a exchange provider.", async () => {

    let exchangeInstance = await ExchangeProvider.deployed();
    let instance = await Core.deployed();
    let result = await instance.setProvider(2, exchangeInstance.address);
    let name = result.logs.find(l => { return l.event === 'ProviderUpdated'; }).args.name;
    assert.equal(name, "2");
  })

  //strategy provider
  it("Should be able to create a strategy.", async () => {
    let instance = await StrategyProvider.deployed();
    let result = await instance.createStrategy(mockData.name, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.exchangeId, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to set a strategy provider.", async () => {
    let instance = await Core.deployed();
    let strategyInstance = await StrategyProvider.deployed();

    let result = await instance.setProvider(0, strategyInstance.address);
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to get a strategy count.", async () => {
    let instance = await Core.deployed();
    let result = await instance.getStrategyCount.call();
    assert.equal(result.toNumber(), 1);
  })

  it("Should be able to get a strategy by index.", async () => {
    let instance = await Core.deployed();
    let result = await instance.getStrategy.call(0);

    assert.equal(result[0], mockData.name);          //asert name
    assert.equal(result[1], mockData.description);   //asert description
    assert.equal(result[2], mockData.category);      //asert category
    assert.equal(result[5].toNumber(), mockData.follower);                            //asert follower
    assert.equal(result[6].toNumber(), mockData.amount);                              //asert amount
    assert.equal(result[7], '');                                     //asert exchangeId
    //assert.equal(result[6].toNumber(), 2);                              //asert amount
  })

  it("Should be able to get a getStrategyTokenAndWeightByIndex.", async () => {
    let instance = await Core.deployed();
    let result = await instance.getStrategyTokenAndWeightByIndex.call(0, 0);

    assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[0].toLowerCase());          //asert name
    assert.equal(result[1].toNumber(), mockData.weights[0]);   //asert description

    result = await instance.getStrategyTokenAndWeightByIndex.call(0, 1);

    assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[1].toLowerCase());          //asert name
    assert.equal(result[1].toNumber(), mockData.weights[1]);   //asert description
  })

  // //price provider
  it("Should be able to get prices from kyber.", async () => {

    let result = await provider.getRates.call(mockData.addresses[0], 1000000000);
    assert.ok(result);
  })

  // //price init
  it("should be able to changeTokens in price provider.", async () => {

    let result = await provider.changeTokens(mockData.tokenAddresses, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to update supported exchanges.", async () => {
    let result = await provider.changeExchanges(mockData.exchangesAddressHash, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to update supported Provider.", async () => {
    let result1 = await provider.changeProviders([accounts[1], accounts[2]], mockData.tokenAddresses[0], { from: accounts[0] });
    let result2 = await provider.changeProviders([accounts[2], accounts[1]], mockData.tokenAddresses[1], { from: accounts[0] });
    assert.equal(result1.receipt.status, '0x01');
    assert.equal(result2.receipt.status, '0x01');
  })

  it("Should be able to update price.", async () => {
    let result0 = await provider.updatePrice(mockData.tokenAddresses[0], mockData.exchangesAddressHash, mockData.tokenOnePrice, 0, { from: accounts[1] });
    let result1 = await provider.updatePrice(mockData.tokenAddresses[1], mockData.exchangesAddressHash, mockData.tokenTwoPrice, 0, { from: accounts[2] });
    assert.equal(result0.receipt.status, '0x01');
    assert.equal(result1.receipt.status, '0x01');
  });

  it("Should be able to set a price provider.", async () => {
    try {
      let instance = await Core.deployed();

      let result = await instance.setProvider(1, provider.address);
      assert.equal(result.receipt.status, '0x01');
    } catch (e) {
      console.error(e);
      throw e;
    }
  });


  //////////////////////////////

  //PLEASE USE provider to get price

  //let result = await provider.getrates.call(mockData.addresses[0],1000000000);

  /////////////////////////////

  //core price

  it("Should be able to get price.", async () => {
    let instance = await Core.deployed();
    let result0 = await instance.getPrice.call(mockData.tokenAddresses[0], 1000000000);
    let result1 = await instance.getPrice.call(mockData.tokenAddresses[1], 1000000000);
    assert.ok(result0.equals(expectedRate));
    assert.ok(result1.equals(expectedRate));
  })

  it("Should be able to get strategy token price.", async () => {
    //TODOlist
    // let instance = await Core.deployed();
    // let result0 = await instance.getStrategyTokenPrice(0, 0);
    // let result1 = await instance.getStrategyTokenPrice(0, 1);

    // // We can check for 0 here, in the price tests these values are checked properly
    // assert.ok(result0.equals(expectedRate));
    // assert.ok(result1.equals(expectedRate));
  })

  //storage provider

  it("Should be able to set a storage provider.", async () => {
    let instance = await Core.deployed();
    let storageInstance = await OlympusStorage.deployed();

    let result = await instance.setProvider(3, storageInstance.address);
    assert.equal(result.receipt.status, '0x01');
  })


  it("Should be able to adjustTradeRange.", async () => {
    let instance = await Core.deployed();
    let result = await instance.adjustTradeRange(mockData.minTradeFeeInWei, mockData.maxTradeFeeInWei, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to adjustFee.", async () => {
    let instance = await Core.deployed();
    let result = await instance.adjustFee(10, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to buy index.", async () => {
    let instance = await Core.deployed();

    let result = await instance.buyIndex(0, accounts[1], false, { from: accounts[0], value: 3000000 });
    assert.equal(result.receipt.status, '0x01');
  })


  it("Should be able to get ethfee.", async () => {
    let instance = await Core.deployed();

    let result = await instance.withdrawETH(accounts[1], { from: accounts[0] });
    assert.equal(result.receipt.status, '0x01');
  })

  it("Should be able to get index order.", async () => {
    let instance = await Core.deployed();
    let result = await instance.getIndexOrder.call(1000000);
    assert.equal(result[0].toNumber(), 0);
    assert.equal(result[3].toNumber(), mockData.maxTradeFeeInWei);
    assert.equal(result[4].toNumber(), mockData.tokenAddresses.length);
  })

  it("Should be able to getSubOrderStatus.", async () => {
    let instance = await Core.deployed();

    let result = await instance.getSubOrderStatus.call(1000000, mockData.tokenAddresses[0]);

    assert.equal(result.toNumber(), 3);
  })

  it("Should be able to buy token for fund option.", async () => {
    let srcAmountETH = 1;
    let needDeposit = srcAmountETH * mockData.tokensLenght;
    let instance = await Core.deployed();
    let amounts = [];
    let rates = [mockData.tokenOnePrice[0], mockData.tokenTwoPrice[0]];
    for (let i = 0; i < mockData.tokensLenght; i++) {
      let erc20Token = await SimpleERC20Token.at(mockData.tokenAddresses[i]);
      let tokenBalance = await erc20Token.balanceOf(accounts[0]);
      amounts.push(web3.toWei(srcAmountETH));
    }
    let result = await instance.buyToken("", mockData.tokenAddresses, amounts, rates, accounts[0],   { from: accounts[0], value: web3.toWei(needDeposit) });

    for (let i = 0; i < mockData.tokensLenght; i++) {
      let erc20Token = await SimpleERC20Token.at(mockData.tokenAddresses[i]);
      let tokenBalance = await erc20Token.balanceOf(accounts[0]);
    }
  })

  it("Should be able to sell token for fund option.", async () => {
    let srcAmountETH = 1;
    let needDeposit = srcAmountETH * mockData.tokensLenght;
    let instance = await Core.deployed();
    let amounts = [];
    let rates = [mockData.tokenOnePrice[1], mockData.tokenTwoPrice[1]];
    for (let i = 0; i < mockData.tokensLenght; i++) {
      let erc20Token = await SimpleERC20Token.at(mockData.tokenAddresses[i]);
      let tokenBalance = await erc20Token.balanceOf(accounts[0]);
      await erc20Token.approve(instance.address, tokenBalance);

      amounts.push(web3.toWei(srcAmountETH));
    }
    let balance = await web3.eth.getBalance(accounts[0]);

    let result = await instance.sellToken("", mockData.tokenAddresses, amounts, rates, accounts[0]);

    for (let i = 0; i < mockData.tokensLenght; i++) {
      let erc20Token = await SimpleERC20Token.at(mockData.tokenAddresses[i]);
      let tokenBalance = await erc20Token.balanceOf(accounts[0]);
    }
  })

  after("clean", async () => {
    await kyberExchange.withdraw(0);
  })
})
