const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");

const tokenNum = 3;
const ethToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

function bytes32ToString(bytes32){
    return web3.toAscii(bytes32).replace(/\u0000/g,'');
}

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

    it("KyberNetworkExchange should be enable/disable.", async () => {
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);

        await kyberExchange.addExchange(0, "kyber");
        // default is enabled
        let enabled = await kyberExchange.isEnabled(0);
        assert.ok(enabled);

        await kyberExchange.disable(0)
        enabled = await kyberExchange.isEnabled(0)
        assert.ok(!enabled);

        await kyberExchange.enable(0)
        enabled = await kyberExchange.isEnabled(0)
        assert.ok(enabled);
    })

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
})


const ExchangeStatusEnabled = 0;
const ExchangeStatusDisabled = 1;

contract('ExchangeAdapterManager', (accounts) => {

    it("ExchangeAdapterManager should be able to deploy and addExchange.", async () => {

        let manager = await ExchangeAdapterManager.new();
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);

        let expectedExchangeName = "kyber";
        // Test addExchange
        let result = await manager.addExchange(expectedExchangeName,kyberExchange.address);
        let addedEvent = result.logs.find(log => {
            return log.event === 'AddedExchange';
        })

        assert.ok(addedEvent, "expect emit AddedExchange event");
        let exchangeId = addedEvent.args.id;

        // Test getExchangeInfo
        result = await manager.getExchangeInfo(exchangeId);
        let actualExchangeName = bytes32ToString(result[0]);
        let actualExchangeStatus = result[1].toString();
        assert.equal(actualExchangeName, expectedExchangeName, `expect exchange name is ${expectedExchangeName}, but got ${actualExchangeName}`);
        assert.equal(actualExchangeStatus, ExchangeStatusEnabled+'', `expect exchange status is enabled(0), but got ${actualExchangeStatus}`);

        // Test getExchangeAdapter
        let actualAdatperAddress = await manager.getExchangeAdapter(exchangeId)
        assert.equal(actualAdatperAddress, kyberExchange.address);

        // Test getExchanges
        let actualExchangesId = await manager.getExchanges()
        assert.equal(actualExchangesId.length, 1);
        assert.equal(actualExchangesId[0], exchangeId);

        // disable Exchange
        await kyberExchange.disable(exchangeId);
        result = await manager.getExchangeInfo(exchangeId);
        actualExchangeStatus = result[1].toString();
        assert.equal(actualExchangeStatus, ExchangeStatusDisabled + '', `expect exchange status is diabled(1), but got ${actualExchangeStatus}`);

        // enable Exchange
        await kyberExchange.enable(exchangeId);
        result = await manager.getExchangeInfo(exchangeId);
        actualExchangeStatus = result[1].toString();
        assert.equal(actualExchangeStatus, ExchangeStatusEnabled + '', `expect exchange status is enabled(0), but got ${actualExchangeStatus}`);
    })

    it("ExchangeAdapterManager checkTokenSupported.", async () => {

        let manager = await ExchangeAdapterManager.new();
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let expectedExchangeName = "kyber";
        let result = await manager.addExchange(expectedExchangeName,kyberExchange.address);

        let tokens = await mockKyber.supportedTokens();
        for (var i = 0; i < tokens.length; i++) {
            let isSupported = await manager.checkTokenSupported(tokens[i]);
            assert.ok(isSupported, `expect token ${tokens[i]} is supported`);
        }

        let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        let isSupported = await manager.checkTokenSupported(notSupported);
        assert.ok(!isSupported)
    })

    it("ExchangeAdapterManager pickExchange.", async () => {

        let manager = await ExchangeAdapterManager.new();
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let expectedExchangeName = "kyber";
        let result = await manager.addExchange(expectedExchangeName,kyberExchange.address);
        let exchangeId = result.logs.find(log => { return log.event === 'AddedExchange'; }).args.id;

        let tokens = await mockKyber.supportedTokens();
        for (var i = 0; i < tokens.length; i++) {
            let actualExchangeId = await manager.pickExchange(tokens[i], 0, expectedRate)
            assert.ok(actualExchangeId, exchangeId, `expect token ${tokens[i]} is supported`);
        }

        let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        let actualExchangeId = await manager.pickExchange(notSupported, 0, expectedRate)
        assert.equal(actualExchangeId, '0x0000000000000000000000000000000000000000000000000000000000000000');
    })
})

const MarketOrderStatusPending = 0;
const MarketOrderStatusPlaced = 1;
const MarketOrderStatusPartiallyCompleted = 2;
const MarketOrderStatusCompleted = 3;
const MarketOrderStatusCancelled = 4;
const MarketOrderStatusErrored = 5;

contract('ExchangeProvider', (accounts) => {

    it("test placeOrder", async () => {

        let manager = await ExchangeAdapterManager.new();
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let expectedExchangeName = "kyber";
        let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);

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
            assert.ok(actualBalance.equals(0));
        }

        await exchangeProvider.startPlaceOrder(orderId, deposit);

        for (let i = 0; i < tokens.length; i++) {
            await exchangeProvider.addPlaceOrderItem(orderId, tokens[i], web3.toWei(srcAmountETH), expectedRate);
        }

        result = await exchangeProvider.endPlaceOrder(orderId, { value: web3.toWei(totalSrcAmountETH) });

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

    it("test checkTokenSupported", async () => {

        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let expectedExchangeName = "kyber";
        let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);

        let exchangeProvider = await ExchangeProvider.new(manager.address);

        let tokens = await mockKyber.supportedTokens();

        for (let i = 0; i < tokens.length; i++) {
            let isSupported = await exchangeProvider.checkTokenSupported(tokens[i]);
            assert.ok(isSupported);
        }

        let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        let isSupported = await exchangeProvider.checkTokenSupported(notSupported);
        assert.ok(!isSupported);
    })
})

contract('ExchangeProviderWrap', (accounts) => {


    it("should be able to buy", async () => {
        let manager = await ExchangeAdapterManager.new(0);
        let mockKyber = await MockKyberNetwork.new(tokenNum);
        let kyberExchange = await KyberNetworkExchange.new(mockKyber.address);
        let expectedExchangeName = "kyber";
        let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);

        let exchangeProvider = await ExchangeProvider.new(manager.address);
        let exchangeProviderWrap = await ExchangeProviderWrap.new(exchangeProvider.address);

        let tokens = await mockKyber.supportedTokens();
        let srcAmountETH = 1;
        let totalSrcAmountETH = srcAmountETH * tokens.length;

        await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));

        let orderId = new Date().getTime();
        let amounts = tokens.map(()=>{return web3.toWei(srcAmountETH,'ether')});
        let rates = tokens.map(() => { return expectedRate });
        let deposit = accounts[0];
        result = await exchangeProviderWrap.buy(orderId, tokens, amounts, rates, deposit, { value: web3.toWei(totalSrcAmountETH, 'ether') });

        // Let's check those tokens's balance of deposit account
        for (let i = 0; i < tokens.length; i++) {
            let erc20Token = await SimpleERC20Token.at(tokens[i]);
            let actualBalance = await erc20Token.balanceOf(deposit);
            let expectedBalance = expectedRate.mul(srcAmountETH);
            assert.ok(expectedBalance.equals(actualBalance));
        }
    })
})