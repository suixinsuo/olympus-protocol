const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const CentralizedExchange = artifacts.require("CentralizedExchange");

const tokenNum = 2;
const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, '');
}

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

const ExchangeStatusEnabled = 0;
const ExchangeStatusDisabled = 1;

contract('CentralizedExchange', (accounts) => {

  let testCase = [{
    name: 'shapeshift'
  }, {
    name: 'binance'
  }, {
    name: 'okex'
  }];

  it('test addExchange and enable/disable', async () => {

    let id = 1000;

    let exchangeAdapterManager = await ExchangeAdapterManager.deployed();

    let centralizedExchange = await CentralizedExchange.deployed();

    for (let i = 0; i < testCase.length; i++) {
      let result = await exchangeAdapterManager.addExchange(testCase[i].name, centralizedExchange.address);
      let actualExchangeId = result.logs.find((l) => { return l.event === 'AddedExchange' }).args.id;
      testCase[i].exchangeId = actualExchangeId;

      result = await centralizedExchange.getExchange(actualExchangeId);
      assert.equal(bytes32ToString(result[0]), testCase[i].name);
      assert.equal(result[1].toString(), ExchangeStatusEnabled + '');

      // disable exchange
      await centralizedExchange.disable(actualExchangeId);
      result = await centralizedExchange.isEnabled(actualExchangeId);
      assert.ok(!result);

      // enable exchange
      result = await centralizedExchange.enable(actualExchangeId);
      result = await centralizedExchange.isEnabled(actualExchangeId);
      assert.ok(result);
    }
  })

  it('test getRate', async () => {

    let centralizedExchange = await CentralizedExchange.deployed();
    let tokens = [];
    for (var i = 0; i < 3; i++) {
      let t = await SimpleERC20Token.new(18);
      tokens.push(t.address)
    }
    let rates = tokens.map(() => { return expectedRate });

    // Supported, but unknown rate
    let t = await SimpleERC20Token.new(18);
    tokens.push(t.address);
    rates.push(-1);

    let exchangeId = testCase[0].exchangeId;

    await centralizedExchange.setRates(exchangeId, tokens, rates);

    for (let i = 0; i < tokens.length; i++) {
      let rate = await centralizedExchange.getRate(exchangeId, tokens[i], 0);
      assert.ok(rate.equals(rates[i]));
    }

    // unsupported
    let rate = await centralizedExchange.getRate(exchangeId, ethToken, 0);
    assert.ok(rate.equals(0));
  })

  it('test placeOrder', async () => {

    let centralizedExchange = await CentralizedExchange.deployed();
    let simpleToken = await SimpleERC20Token.new(18);
    let exchangeId = testCase[0].exchangeId;
    let token = simpleToken.address;
    let srcAmount = web3.toWei(1, 'ether');
    let deposit = accounts[1];
    let orderIdOffset = 1000000;

    let result = await centralizedExchange.placeOrder(exchangeId, token, srcAmount, expectedRate, deposit);
    let orderInfo = result.logs.find((r) => { return r.event == 'PlacedOrder'; });

    assert.equal(orderInfo.args.exchangeId, exchangeId);
    assert.equal(orderInfo.args.orderId.toString(), orderIdOffset++ + '');
  })
})


