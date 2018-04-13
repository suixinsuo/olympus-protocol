const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");

const tokenNum = 3;
const ethToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const Promise = require('bluebird');
contract('MockKyberNetwork', (accounts) => {

    it("MockKyberNetwork should be able to trade.", async () => {
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let tokens = await mockKyber.supportedTokens();
        assert.equal(tokens.length, tokenNum);
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
});


const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

contract('KyberNetworkExchange', (accounts) => {

    it("KyberNetworkExchange should be able to placeOrder.", async () => {

        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let tokens = await mockKyber.supportedTokens();

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
            let rate = await kyberExchange.getRate(tokens[i], 0);
            assert.ok(expectedRate.equals(rate));

            let deposit = accounts[0];
            let srcAmountETH = 1;
            // Test placeOrder
            let result = await kyberExchange.placeOrder(tokens[i], web3.toWei(srcAmountETH), rate, deposit);

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
})


contract('ExchangeAdapterManager', (accounts) => {

    it("ExchangeAdapterManager should be able to deploy and un/registerExchanger.", async () => {

        // Test New without init adapter
        let manager = await ExchangeAdapterManager.new(0);
        assert.ok(manager)

        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);

        // Test RegisterExchange
        let result = await manager.registerExchange(kyberExchange.address);

        let registedEvent = result.logs.find(log => {
            return log.event === 'ExchangeAdapterRegisted';
        })

        let actualRegistedAdapter = registedEvent.args.exchange;
        let expectedRegistedAdapter = kyberExchange.address;
        assert.equal(actualRegistedAdapter, expectedRegistedAdapter);

        // Test Register an exsit exchange
        result = await manager.registerExchange(kyberExchange.address);

        assert.equal(result.logs.length, 0);

        // Test unregisterExchange
        result = await manager.unregisterExchange(kyberExchange.address);
        let unregistedEvent = result.logs.find(log => { return log.event === 'ExchangeAdapterUnRegisted'; })
        assert.ok(unregistedEvent);

        let actualUnRegistedAdapter = unregistedEvent.args.exchange;
        let expectedUnRegistedAdapter = kyberExchange.address;
        assert.equal(actualUnRegistedAdapter, expectedUnRegistedAdapter);

        // Test UnRegister an unkown exchange
        try {
            result = await manager.unregisterExchange(kyberExchange.address);
            assert.ok(false);
        } catch (e) {
            assert.ok(e);
        }

        // Test RegisterExchange Again
        result = await manager.registerExchange(kyberExchange.address);
        registedEvent = result.logs.find(log => { return log.event === 'ExchangeAdapterRegisted'; })
        actualRegistedAdapter = registedEvent.args.exchange;
        assert.equal(actualRegistedAdapter, expectedRegistedAdapter);
    })

    it("ExchangeAdapterManager checkTokenSupported.", async () => {

        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        await manager.registerExchange(kyberExchange.address);
        let tokens = await mockKyber.supportedTokens();
        for (var i = 0; i < tokens.length; i++) {
            let isSupported = await manager.checkTokenSupported(tokens[i])
            assert.ok(isSupported);
        }

        let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        let isSupported = await manager.checkTokenSupported(notSupported);
        assert.ok(!isSupported)
    })

    it("ExchangeAdapterManager pickExchange.", async () => {

        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        await manager.registerExchange(kyberExchange.address);
        let tokens = await mockKyber.supportedTokens();

        for (var i = 0; i < tokens.length; i++) {
            let exchange = await manager.pickExchange(tokens[i], 0, expectedRate)
            assert.equal(exchange, kyberExchange.address);
        }

        let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        let exchange = await manager.pickExchange(notSupported, 0, expectedRate)
        assert.equal(exchange, '0x0000000000000000000000000000000000000000');
    })


})

const MarketOrderStatusPending = 0;
const MarketOrderStatusPlaced = 1;
const MarketOrderStatusPartiallyCompleted = 2;
const MarketOrderStatusCompleted = 3;
const MarketOrderStatusCancelled = 4;
const MarketOrderStatusErrored = 5;

contract('ExchangeProvider', (accounts) => {
    it("They should be able to deploy.", function() {
        return Promise.all([
        PermissionProvider.deployed(),
        ])
        .spread((/*price, strategy, exchange,*/ core) =>  {
        assert.ok(core, 'Permission contract is not deployed.');
        });
    });
    it("test placeOrder", async () => {
        let permissionInstance = await PermissionProvider.deployed(); 

        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        await manager.registerExchange(kyberExchange.address);
        // let exchangeProvider = await ExchangeProvider.new(manager.address, permissionInstance.address);
        let exchangeProvider = await ExchangeProvider.new(manager.address);
        let tokens = await mockKyber.supportedTokens();
        let srcAmountETH = 1;
        let totalSrcAmountETH = srcAmountETH * tokens.length;

        await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));

        let orderId = new Date().getTime();
        let deposit = accounts[0];

        for (let i = 0; i < tokens.length; i++) {
            let erc20Token = await SimpleERC20Token.at(tokens[i]);
            let actualBalance = await erc20Token.balanceOf(deposit);
        }

        await exchangeProvider.startPlaceOrder(orderId, deposit);

        for (let i = 0; i < tokens.length; i++) {
            await exchangeProvider.addPlaceOrderItem(orderId, tokens[i], web3.toWei(srcAmountETH), expectedRate);
        }

        let result = await exchangeProvider.endPlaceOrder(orderId, { value: web3.toWei(totalSrcAmountETH) });

        // Let's check those tokens's balance of deposit account
        for (let i = 0; i < tokens.length; i++) {
            let erc20Token = await SimpleERC20Token.at(tokens[i]);
            let actualBalance = await erc20Token.balanceOf(deposit);
            let expectedBalance = expectedRate.mul(srcAmountETH);
            assert.ok(expectedBalance.equals(actualBalance));
        }

        // Test getSubOrderStatus
        for (let i = 0; i < tokens.length; i++) {
            let status = await exchangeProvider.getSubOrderStatus(orderId, tokens[i]);
            assert.equal(status, MarketOrderStatusCompleted);
        }
    })

    it("test checkToeknSupported", async () => {
        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        await manager.registerExchange(kyberExchange.address);
        let exchangeProvider = await ExchangeProvider.new(manager.address);
        let tokens = await mockKyber.supportedTokens();

        for (let i = 0; i < tokens.length; i++) {
            let isSupported = await exchangeProvider.checkTokenSupported(tokens[i]);
            assert.ok(isSupported);
        }
    })
})
