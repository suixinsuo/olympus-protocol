const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
const StrategyProvider = artifacts.require("../contracts/strategy/StrategyProvider.sol");
const PriceProvider = artifacts.require("../contracts/price/PriceProvider.sol");
// const KyberMock = artifacts.require("./helper/KyberNetworkMock.sol");
// const Exchange = artifacts.require("../contracts/exchange/ExchangeProviderWrap.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");

const OlympusStorage = artifacts.require("../contracts/storage/OlympusStorage.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");

const _ = require('lodash');
const Promise = require('bluebird');
const mockData = {
  tokensum:3,
  id: 0,
  name: "test",
  description: "test strategy",
  category: "multiple",
  tokenAddresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  exchangesAddressHash: ["0x6269626f78", "0x1269626f78"],
  tokenOnePrice: [1000000, 20000],
  addresses:["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  tokenTwoPrice: [3000000, 40000],
  weights: [80, 20],
  follower: 0,
  amount: 0,
  exchangeId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  minTradeFeeInWei: 2000000,
  maxTradeFeeInWei: 3000000
}

const ethToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

let provider;

contract('Olympus-Protocol', function(accounts) {
    it("They should be able to deploy.", function() {
        return Promise.all([
        OlympusStorage.deployed(),
        PriceProvider.deployed(),
        StrategyProvider.deployed(),
        PermissionProvider.deployed(),
        Core.deployed(),
        ])
        .spread((/*price, strategy, exchange,*/ core) =>  {
        assert.ok(core, 'Core contract is not deployed.');
        });
    });
    //test kyber
    it("MockKyberNetwork should be able to trade.", async () => {

        let mockKyber = await MockKyberNetwork.new(mockData.tokensum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let tokens = await mockKyber.supportedTokens();
        //provider = await PriceProvider.new(mockKyber.address);

        assert.equal(tokens.length, mockData.tokensum);
        let destAddress = accounts[0];

        for (var i = 0; i < tokens.length; i++) {
            let rates = await mockKyber.getExpectedRate(ethToken, tokens[i], 0)
            assert.ok(expectedRate.equals(rates[0]));
            assert.ok(expectedRate.equals(rates[1]));

            let erc20Token = await SimpleERC20Token.at(tokens[i]);
            let tokenBalance = await erc20Token.balanceOf(destAddress);
            assert.ok(tokenBalance.equals(0));

            let srcAmountETH = 1;
            let result = await mockKyber.trade(
                ethToken,
                web3.toWei(srcAmountETH),
                tokens[i],
                destAddress,
                0,
                rates[1],
                0, { value: web3.toWei(srcAmountETH) });
            tokenBalance = await erc20Token.balanceOf(destAddress);
            assert.ok(expectedRate.mul(srcAmountETH).equals(tokenBalance));
        }
    });



  it("KyberNetworkExchange should be able to placeOrder.", async () => {

    let mockKyber = await MockKyberNetwork.new(mockData.tokensum);
    let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
    let Permission = await PermissionProvider.deployed();
    provider = await PriceProvider.new(Permission.address);
    let result2 = await provider.setKyber(mockKyber.address);
    let tokens = await mockKyber.supportedTokens();

    mockData.addresses[0] = tokens[0];
    mockData.addresses[1] = tokens[1];
 
    // without pre-deposit
    let srcAmountETH = 1;
    let needDeposit = srcAmountETH * tokens.length;
    let balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(0), 'kyberExchange\'s balance should be 0 before deposit');
    await kyberExchange.send(web3.toWei(needDeposit, 'ether'));
    balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(web3.toWei(needDeposit)), `kyberExchange's balance should be ${web3.toWei(needDeposit, 'ether').toString()} after deposit`);
    let expectedAllowanced = expectedRate.mul(srcAmountETH);
    for (var i = 0; i < tokens.length; i++) {

        // Test getRate
        let rate = await kyberExchange.getRate('', tokens[i], 0);
        assert.ok(expectedRate.equals(rate));

        let deposit = accounts[0];
        let srcAmountETH = 1;
        // Test placeOrder
        let result = await kyberExchange.placeOrder('', tokens[i], web3.toWei(srcAmountETH), rate, deposit);

        let placedOrderEvent = result.logs.find(log => {
            return log.event === 'PlacedOrder';
        });
        assert.ok(placedOrderEvent);

        let actualOrderId = parseInt(placedOrderEvent.args.orderId);
        let expectedOrderId = i + 1;
        assert.equal(actualOrderId, expectedOrderId);

        let erc20Token = await SimpleERC20Token.at(tokens[i]);
        let actualAllowance = await erc20Token.allowance(kyberExchange.address, deposit);
        assert.ok(expectedAllowanced.equals(actualAllowance));

        let orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
        assert.equal(orderStatus, OrderStatusApproved);

        // Test payOrder
        await kyberExchange.payOrder(actualOrderId, { value: web3.toWei(srcAmountETH) });
        orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
        assert.equal(orderStatus, OrderStatusCompleted);
    }
})
    //exchange init

    it("should be able to set a exchange provider.", async () => {

        let permissionInstance = await PermissionProvider.deployed();

        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(2);
        let tokens = await mockKyber.supportedTokens();

        mockData.tokenAddresses[0] = tokens[0];
        mockData.tokenAddresses[1] = tokens[1];

        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        await manager.addExchange("kyber", kyberExchange.address);
        let exchangeInstance = await ExchangeProvider.new(manager.address);
        // let exchangeInstance = await ExchangeProvider.new(manager.address, permissionInstance.address);

        let instance = await Core.deployed();
        let result = await instance.setProvider(2, exchangeInstance.address);

        let srcAmountETH = 1;
        let totalSrcAmountETH = srcAmountETH * tokens.length;

        await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));
        assert.equal(result.receipt.status, '0x01');                                      
    })

    //strategy provider
    it("should be able to create a strategy.", async () => {
        let instance = await StrategyProvider.deployed();
        let result = await instance.createStrategy(mockData.name, mockData.description, mockData.category, mockData.tokenAddresses, mockData.weights, mockData.exchangeId, {from:accounts[0]});
        assert.equal(result.receipt.status, '0x01');
    })

    it("should be able to set a strategy provider.", async () => {
        let instance = await Core.deployed();
        let strategyInstance = await StrategyProvider.deployed();

        let result = await instance.setProvider(0,strategyInstance.address);
        assert.equal(result.receipt.status, '0x01');                                  
    })

    it("should be able to get a strategy count.", async () => {
        let instance = await Core.deployed();
        let result = await instance.getStrategyCount.call();
        assert.equal(result.toNumber(), 1);                                  
    })

    it("should be able to get a strategy by index.", async () => {
        let instance = await Core.deployed();
        let result = await instance.getStrategy.call(0);

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
        let result = await instance.getStrategyTokenAndWeightByIndex.call(0,0);

        assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[0].toLowerCase());          //asert name
        assert.equal(result[1].toNumber(), mockData.weights[0]);   //asert description

        result = await instance.getStrategyTokenAndWeightByIndex.call(0,1);

        assert.equal(result[0].toLowerCase(), mockData.tokenAddresses[1].toLowerCase());          //asert name
        assert.equal(result[1].toNumber(), mockData.weights[1]);   //asert description
    })

    // //price provider
    it("should be able to get prices from kyber.", async () => {
        let result = await provider.getrates.call(mockData.addresses[0],1000000000);
        assert.ok(result);
    })

    // //price init
    it("should be able to changeTokens in price provider.", async () => {

        let result = await provider.changeTokens(mockData.tokenAddresses, { from: accounts[0] });
        assert.equal(result.receipt.status, '0x01');
      })
    
      it("Should be able to update support exchanges.", async () => {
        let result = await provider.changeExchanges(mockData.exchangesAddressHash, { from: accounts[0] });
        assert.equal(result.receipt.status, '0x01');
      })
    
      it("Should be able to update support Provider.", async () => {
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
    
      it("should be able to set a price provider.", async () => {
        let instance = await Core.deployed();
    
        let result = await instance.setProvider(1, provider.address);
        assert.equal(result.receipt.status, '0x01');
      })
    



//////////////////////////////

//PLEASE USE provider to get price 

//let result = await provider.getrates.call(mockData.addresses[0],1000000000);

/////////////////////////////

    //core price

    it("should be able to get price.", async () => {
        let instance = await Core.deployed();
        let result0 = await instance.getPrice.call(mockData.tokenAddresses[0]);
        let result1 = await instance.getPrice.call(mockData.tokenAddresses[1]);

        assert.equal(result0.toNumber(), mockData.tokenOnePrice[0]);
        assert.equal(result1.toNumber(), mockData.tokenTwoPrice[0]);
    })

    it("should be able to get strategy token price.", async () => {
        let instance = await Core.deployed();
        let result0 = await instance.getStragetyTokenPrice.call(0,0);
        let result1 = await instance.getStragetyTokenPrice.call(0,1);

        assert.equal(result0.toNumber(), mockData.tokenOnePrice[0]);
        assert.equal(result1.toNumber(), mockData.tokenTwoPrice[0]);
    })

    //storage provider

    it("should be able to set a storage provider.", async () => {
        let instance = await Core.deployed();
        let storageInstance = await OlympusStorage.deployed();

        let result = await instance.setProvider(3, storageInstance.address);
        assert.equal(result.receipt.status, '0x01');                                  
    })
    

    it("should be able to adjustTradeRange.", async () => {
        let instance = await Core.deployed();
        let result = await instance.adjustTradeRange(mockData.minTradeFeeInWei, mockData.maxTradeFeeInWei, {from:accounts[0]});
        assert.equal(result.receipt.status, '0x01');
    })

    it("should be able to adjustFee.", async () => {
        let instance = await Core.deployed();
        let result = await instance.adjustFee(10, {from:accounts[0]});
        assert.equal(result.receipt.status, '0x01');
    })
    
    it("should be able to buy index.", async () => {
        let instance = await Core.deployed();

        let result = await instance.buyIndex(0, accounts[1], {from:accounts[0], value: 3000000});
        assert.equal(result.receipt.status, '0x01');
    })

    it("should be able to get index order.", async () => {
        let instance = await Core.deployed();
        //TODO set the orderId to 1000000 
        let result = await instance.getIndexOrder.call(1000000);
        assert.equal(result[0].toNumber(), 0);
        // assert.equal(result[1].toString(), 0);
        // assert.equal(result[2].toString(), 0);
        assert.equal(result[3].toNumber(), mockData.maxTradeFeeInWei);
        assert.equal(result[4].toNumber(), mockData.tokenAddresses.length);
    })

    it("should be able to getSubOrderStatus.", async () => {
        let instance = await Core.deployed();

        //TODO set the orderId to 1000000 
        let result = await instance.getSubOrderStatus.call(1000000, mockData.tokenAddresses[0]);

        assert.equal(result.toNumber(), 3);
    })

})