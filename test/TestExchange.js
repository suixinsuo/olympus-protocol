const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const CentralizedExchange = artifacts.require("CentralizedExchange");

const tokenNum = 2;
const ethToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const expectedRateToSell = web3.toBigNumber('1000000000000000');
const BigNumber = web3.BigNumber;

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, '');
}

const Promise = require('bluebird');
contract('MockKyberNetwork', (accounts) => {

  it("MockKyberNetwork should be able to trade.", async () => {

    let tokensTotal = 2;
    let tokenDecimals = (new Date().getTime()) % 6 + 12;
    console.info("test with token decimals = ", tokenDecimals);
    let destRate = web3.toBigNumber('1000' + '0'.repeat(tokenDecimals));

    let mockKyber = await MockKyberNetwork.new(tokensTotal, tokenDecimals);
    let tokens = await mockKyber.supportedTokens();
    assert.equal(tokens.length, tokenNum);
    let destAddress = accounts[0];
    for (var i = 0; i < tokens.length; i++) {
      let rates = await mockKyber.getExpectedRate(ethToken, tokens[i], 0);
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
      let expectedBalance = destRate.mul(srcAmountETH);
      assert.ok(expectedBalance.equals(tokenBalance));
    }

    for (var i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      tokenBalance = await erc20Token.balanceOf(destAddress);
      await erc20Token.approve(mockKyber.address, tokenBalance);

      let rates = await mockKyber.getExpectedRate(tokens[i], ethToken, 0);
      assert.equal(expectedRateToSell.toString(),rates[0].toString());

      let srcAmountETH = 1;
      let result = await mockKyber.trade(
        tokens[i],
        tokenBalance,
        ethToken,
        destAddress,
        0,
        rates[1],
        0);
      tokenBalance = await erc20Token.balanceOf(destAddress);
      assert.ok(tokenBalance.equals(0));
    }


  });
});

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusPartiallyCompleted = 2;
const OrderStatusCompleted = 3;
const OrderStatusCancelled = 4;
const OrderStatusErrored = 5;

contract('KyberNetworkExchange', (accounts) => {

  let exchangeId = "";
  let mockKyber;
  let kyberExchange;
  let exchangeAdapterManager;
  let tokens;

  before('setup contract', async () => {
    mockKyber = await MockKyberNetwork.deployed();
    kyberExchange = await KyberNetworkExchange.deployed();
    exchangeAdapterManager = await ExchangeAdapterManager.deployed();
    let result = await exchangeAdapterManager.addExchange("kyber", kyberExchange.address);
    exchangeId = result.logs.find(l => { return l.event == 'AddedExchange'; }).args.id;
    tokens = await mockKyber.supportedTokens();
  })

  it("KyberNetworkExchange should be enable/disable.", async () => {

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

    // without pre-deposit
    let srcAmountETH = 1;
    let needDeposit = srcAmountETH * tokens.length;
    let balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(0), 'kyberExchange\'s balance should be 0 before deposit');
    await kyberExchange.send(web3.toWei(needDeposit, 'ether'));
    balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(web3.toWei(needDeposit)), `kyberExchange's balance should be ${web3.toWei(needDeposit, 'ether').toString()} after deposit`);

    let expectedAllowance = expectedRate.mul(srcAmountETH);

    for (var i = 0; i < tokens.length; i++) {

      // Test getRate
      let rate = await kyberExchange.getRate('', tokens[i], 0);
      assert.ok(expectedRate.equals(rate));

      let deposit = accounts[0];
      let srcAmountETH = 1;
      // Test placeOrder
      let result = await kyberExchange.placeOrder(exchangeId, tokens[i], web3.toWei(srcAmountETH), rate, deposit);

      let placedOrderEvent = result.logs.find(log => {
        return log.event === 'PlacedOrder';
      });
      assert.ok(placedOrderEvent);

      let actualOrderId = parseInt(placedOrderEvent.args.orderId);
      let expectedOrderId = i + 1;
      assert.equal(actualOrderId, expectedOrderId);

      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualAllowance = await erc20Token.allowance(kyberExchange.address, deposit);
      assert.ok(expectedAllowance.equals(actualAllowance));

      let orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
      assert.equal(orderStatus, OrderStatusApproved);

      // Test payOrder
      await kyberExchange.payOrder(actualOrderId, { value: web3.toWei(srcAmountETH) });
      orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
      assert.equal(orderStatus, OrderStatusCompleted);
    }
  })

  it("KyberNetworkExchange should be able to placeOrder with other decimals.", async () => {

    let tokensTotal = 2;
    let tokenDecimals = (new Date().getTime()) % 6 + 12;
    console.info("test with token decimals = ", tokenDecimals);

    let destRate = web3.toBigNumber('1000' + '0'.repeat(tokenDecimals));
    let permission = await PermissionProvider.new();
    let mockKyber = await MockKyberNetwork.new(tokensTotal, tokenDecimals);
    let kyberExchange = await KyberNetworkExchange.new(mockKyber.address, 0, 0, permission.address);

    // without pre-deposit
    let srcAmountETH = 1;
    let needDeposit = srcAmountETH * tokensTotal;
    let balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(0), 'kyberExchange\'s balance should be 0 before deposit');

    await kyberExchange.send(web3.toWei(needDeposit, 'ether'));
    balance = await web3.eth.getBalance(kyberExchange.address);
    assert.ok(balance.equals(web3.toWei(needDeposit)), `kyberExchange's balance should be ${web3.toWei(needDeposit, 'ether').toString()} after deposit`);

    let expectedAllowance = destRate.mul(srcAmountETH);
    let tokens = await mockKyber.supportedTokens();

    for (var i = 0; i < tokens.length; i++) {

      // Test getRate
      let rate = await kyberExchange.getRate('', tokens[i], 0);
      assert.ok(expectedRate.equals(rate));

      let deposit = accounts[0];
      let srcAmountETH = 1;
      // Test placeOrder
      let result = await kyberExchange.placeOrder(exchangeId, tokens[i], web3.toWei(srcAmountETH), rate, deposit);
      let placedOrderEvent = result.logs.find(log => {
        return log.event === 'PlacedOrder';
      });
      assert.ok(placedOrderEvent);

      let actualOrderId = parseInt(placedOrderEvent.args.orderId);
      let expectedOrderId = i + 1;
      assert.equal(actualOrderId, expectedOrderId);

      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualAllowance = await erc20Token.allowance(kyberExchange.address, deposit);
      assert.ok(expectedAllowance.equals(actualAllowance));

      let orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
      assert.equal(orderStatus, OrderStatusApproved);

      // Test payOrder
      await kyberExchange.payOrder(actualOrderId, { value: web3.toWei(srcAmountETH) });
      orderStatus = await kyberExchange.getOrderStatus(actualOrderId);
      assert.equal(orderStatus, OrderStatusCompleted);
    }
  })
  it("KyberNetworkExchange should be able to placeOrderQuickly to buy token option.", async () => {

    // without pre-deposit
    let srcAmountETH = 1;
    for (var i = 0; i < tokens.length; i++) {
      let deposit = accounts[0];
      // Test getRate
      let rate = await kyberExchange.getRate('', tokens[i], 0);
      assert.ok(expectedRate.equals(rate));
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let tokenBalance = await erc20Token.balanceOf(deposit);

      let srcAmountETH = 1;
      // Test placeOrder
      let result = await kyberExchange.placeOrderQuicklyToBuy(exchangeId, tokens[i], web3.toWei(srcAmountETH), rate, deposit);

      let tokenGet = await erc20Token.balanceOf(deposit) - tokenBalance;
      assert.equal(rate.mul(srcAmountETH).toString(), tokenGet.toString());
    }
  })

  it("KyberNetworkExchange should be able to placeOrderQuickly to sell token option.", async () => {

    // without pre-deposit
    let srcAmountETH = 1;
    for (var i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let destAddress = accounts[0];
      let tokenBalance = await erc20Token.balanceOf(destAddress);
      assert.notEqual(new BigNumber(tokenBalance).toNumber(), 0);
      // Test getRate
      let rate = await kyberExchange.getRateToSell('', tokens[i], 0);
      assert.ok(expectedRateToSell.equals(rate));
      // Test placeOrder
      await erc20Token.transfer(kyberExchange.address, tokenBalance);

      let result = await kyberExchange.placeOrderQuicklyToSell(exchangeId, tokens[i], tokenBalance, rate, destAddress);

      tokenBalance = await erc20Token.balanceOf(destAddress);
      assert.equal(new BigNumber(tokenBalance).toNumber(), 0);
    }
  })
})
const ExchangeStatusEnabled = 0;
const ExchangeStatusDisabled = 1;

contract('ExchangeAdapterManager', (accounts) => {

  let expectedExchangeName = "kyber";
  let manager;
  let mockKyber;
  let kyberExchange;
  let tokens;
  let exchangeId;

  before('setup ExchangeAdapterManager', async () => {
    manager = await ExchangeAdapterManager.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    kyberExchange = await KyberNetworkExchange.deployed();
    tokens = await mockKyber.supportedTokens();

    let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);
    let addedEvent = result.logs.find(log => { return log.event === 'AddedExchange'; })

    assert.ok(addedEvent, "Expected that AddedExchange event was emitted");
    exchangeId = addedEvent.args.id;
  })

  it("ExchangeAdapterManager should be able to deploy and addExchange.", async () => {

    // Test addExchange
    // Test getExchangeInfo
    let result = await manager.getExchangeInfo(exchangeId);
    let actualExchangeName = bytes32ToString(result[0]);
    let actualExchangeStatus = result[1].toString();
    assert.equal(actualExchangeName, expectedExchangeName, `Expected that exchange name is ${expectedExchangeName}, but got ${actualExchangeName}`);
    assert.equal(actualExchangeStatus, ExchangeStatusEnabled + '', `Expected that exchange status is enabled(0), but got ${actualExchangeStatus}`);

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
    assert.equal(actualExchangeStatus, ExchangeStatusDisabled + '', `Expected that exchange status is disabled(1), but got ${actualExchangeStatus}`);

    // enable Exchange
    await kyberExchange.enable(exchangeId);
    result = await manager.getExchangeInfo(exchangeId);
    actualExchangeStatus = result[1].toString();
    assert.equal(actualExchangeStatus, ExchangeStatusEnabled + '', `Expected that exchange status is enabled(0), but got ${actualExchangeStatus}`);
  })

  it("ExchangeAdapterManager checkTokenSupported.", async () => {

    for (var i = 0; i < tokens.length; i++) {
      let isSupported = await manager.checkTokenSupported(tokens[i]);
      assert.ok(isSupported, `Expected that token ${tokens[i]} is supported`);
    }

    // let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    // let isSupported = await manager.checkTokenSupported(notSupported);
    // assert.ok(!isSupported)
  })

  it("ExchangeAdapterManager pickExchange.", async () => {

    for (var i = 0; i < tokens.length; i++) {
      let actualExchangeId = await manager.pickExchange(tokens[i], 0, expectedRate)
      assert.ok(actualExchangeId, exchangeId, `Expect that token ${tokens[i]} is supported`);
    }

    let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let actualExchangeId = await manager.pickExchange(notSupported, 0, expectedRate)
    assert.equal(actualExchangeId, '0x0000000000000000000000000000000000000000000000000000000000000000');
  })
})

contract('ExchangeProvider', (accounts) => {

  let expectedExchangeName = "kyber";
  let manager;
  let mockKyber;
  let kyberExchange;
  let tokens;
  let exchangeId;

  before('setup ExchangeAdapterManager', async () => {
    manager = await ExchangeAdapterManager.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    kyberExchange = await KyberNetworkExchange.deployed();
    tokens = await mockKyber.supportedTokens();
    exchangeProvider = await ExchangeProvider.deployed();

    let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);
    let addedEvent = result.logs.find(log => { return log.event === 'AddedExchange'; })

    assert.ok(addedEvent, "Expected that the AddedExchange event was emitted");
    exchangeId = addedEvent.args.id;
  })

  it("Test placeOrder.", async () => {

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
      assert.equal(status, OrderStatusCompleted);
    }
  })

  it("Test sellToken.", async () => {
    let srcAmountETH = 1;
    let totalSrcAmountETH = srcAmountETH * tokens.length;

    await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));

    let deposit = accounts[0];
    let amounts = [];
    let rates = [];
    let beforeBalance = 0;

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualBalance = await erc20Token.balanceOf(deposit);
      console.log(actualBalance);
      amounts.push(actualBalance);

      rates.push(expectedRateToSell);
      await erc20Token.transfer(exchangeProvider.address, actualBalance);
    }
    beforeBalance = await web3.eth.getBalance(deposit);
    console.log(beforeBalance);
    result = await exchangeProvider.sellToken("",tokens, amounts, rates, deposit);

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualBalance = await erc20Token.balanceOf(deposit);
      console.log(actualBalance);
    }
    assert.ok(new BigNumber(await web3.eth.getBalance(deposit)).minus(beforeBalance).toNumber() > 0);
  })

  it("Test buyToken.", async () => {
    let srcAmountETH = 1;
    let totalSrcAmountETH = srcAmountETH * tokens.length;

    await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));

    let deposit = accounts[0];
    let amounts = [];
    let rates = [];
    let actualBalance = [];

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      actualBalance.push(await erc20Token.balanceOf(deposit)); 
      amounts.push(web3.toWei(srcAmountETH));
      rates.push(expectedRate);
    }

    result = await exchangeProvider.buyToken("",tokens, amounts, rates, deposit,  { value: web3.toWei(totalSrcAmountETH) });

    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let tokenBalance = await erc20Token.balanceOf(deposit);
      assert.equal(new BigNumber(actualBalance[i]).plus(expectedRate.mul(srcAmountETH)).toNumber(), tokenBalance.toNumber())
    }
  })

  it("Test checkTokenSupported.", async () => {

    for (let i = 0; i < tokens.length; i++) {
      let isSupported = await exchangeProvider.checkTokenSupported(tokens[i]);
      assert.ok(isSupported);
    }

    // let notSupported = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    // let isSupported = await exchangeProvider.checkTokenSupported(notSupported);
    // assert.ok(!isSupported);
  })
})

contract('ExchangeProviderWrap', (accounts) => {

  let expectedExchangeName = "kyber";
  let manager;
  let exchangeProvider;

  before('setup ExchangeAdapterManager', async () => {
    manager = await ExchangeAdapterManager.deployed();
    exchangeProvider = await ExchangeProvider.deployed();
    exchangeProviderWrap = await ExchangeProviderWrap.deployed();
    await exchangeProvider.setCore(exchangeProviderWrap.address);
  })

  it("Should be able to buy using KyberNetwork.", async () => {

    let mockKyber = await MockKyberNetwork.deployed();
    let kyberExchange = await KyberNetworkExchange.deployed();
    let tokens = await mockKyber.supportedTokens();
    let result = await manager.addExchange(expectedExchangeName, kyberExchange.address);
    let addedEvent = result.logs.find(log => { return log.event === 'AddedExchange'; })

    let srcAmountETH = 1;
    let totalSrcAmountETH = srcAmountETH * tokens.length;

    await kyberExchange.send(web3.toWei(totalSrcAmountETH, 'ether'));

    let orderId = new Date().getTime();
    let amounts = tokens.map(() => { return web3.toWei(srcAmountETH, 'ether') });
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

    let orderInfo = result.logs.find(l => { return l.event === 'OrderStatusUpdated' }).args;
    assert.equal(orderInfo.orderId, orderId);
    assert.equal(orderInfo.status, OrderStatusCompleted)
  })

  it("Should be able to buy using CentralizedExchange.", async () => {

    // begin set up
    let manager = await ExchangeAdapterManager.deployed();
    let centralizedExchange = await CentralizedExchange.deployed();
    let tokens = [];
    let owner = accounts[0];
    for (let i = 0; i < tokenNum; i++) {
      let t = await SimpleERC20Token.new(18, { from: owner });
      tokens.push(t.address);
    }
    let rates = tokens.map(() => { return expectedRate; });
    let result = await manager.addExchange('shapeshift', centralizedExchange.address);
    let exchangeId = result.logs.find((l) => { return l.event === 'AddedExchange' }).args.id;

    await centralizedExchange.setRates(exchangeId, tokens, rates);

    await centralizedExchange.setAdapterOrderCallback(exchangeProvider.address);

    let srcAmountETH = 1;
    let totalSrcAmountETH = srcAmountETH * tokens.length;

    let orderId = new Date().getTime();
    let amounts = tokens.map(() => { return web3.toWei(srcAmountETH, 'ether') });
    let deposit = accounts[1];

    result = await exchangeProviderWrap.buy(orderId, tokens, amounts, rates, deposit, { value: web3.toWei(totalSrcAmountETH, 'ether') });
    let fromBlock = result.receipt.blockNumber;
    let e = centralizedExchange.PlacedOrder({}, { fromBlock: fromBlock, toBlock: 'latest' });// , function (error, log) {

    let logs = await (async () => { return new Promise(resolve => { e.get((err, logs) => { resolve(logs); }) }) })()
    let payee = accounts[2];
    let payeeBalance = await web3.eth.getBalance(payee);

    for (let i = 0; i < logs.length; i++) {
      // 1. send token to owner
      let orderId = logs[i].args.orderId;
      let orderInfo = await centralizedExchange.getOrderInfo(orderId);
      let erc20Token = SimpleERC20Token.at(orderInfo[1]);
      let orderDeposit = orderInfo[5];

      // 2. owner approve token
      let destCompletedAmount = expectedRate.mul(srcAmountETH);
      await erc20Token.approve(orderDeposit, destCompletedAmount);

      // 3. callback
      let result = await centralizedExchange.PlaceOrderCompletedCallback(orderInfo[6], owner, payee, orderId, web3.toWei(srcAmountETH), destCompletedAmount);
    }

    // Let's check those tokens' balance of deposit account
    for (let i = 0; i < tokens.length; i++) {
      let erc20Token = await SimpleERC20Token.at(tokens[i]);
      let actualBalance = await erc20Token.balanceOf(deposit);
      let expectedBalance = expectedRate.mul(srcAmountETH);
      assert.ok(expectedBalance.equals(actualBalance));
    }

    let afterPayeeBalance = await web3.eth.getBalance(payee);
    assert.ok(afterPayeeBalance.sub(payeeBalance).equals(web3.toWei(tokenNum * srcAmountETH)));
  })
})
