const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const CentralizedExchange = artifacts.require("CentralizedExchange");

const tokenNum = 3;
const ethToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

function bytes32ToString(bytes32){
    return web3.toAscii(bytes32).replace(/\u0000/g,'');
}

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

const ExchangeStatusEnabled = 0;
const ExchangeStatusDisabled = 1;

contract('CentralizedExchange', (accounts) => {

    it('test addExchange and enable/disable', async () => {

        let id = 1;
        let testCase = [{
            exchangeId: web3.sha3(id++ + ''),
            name: 'shipeshift'
        }, {
            exchangeId: web3.sha3(id++ + ''),
            name: 'binance'
        }, {
            exchangeId: web3.sha3(id++ + ''),
            name: 'okex'
        }];

        let centralizedExchange = await CentralizedExchange.new();

        for (let i = 0; i < testCase.length; i++) {
            await centralizedExchange.addExchange(testCase[i].exchangeId, testCase[i].name);
            result = await centralizedExchange.getExchange(testCase[i].exchangeId);
            assert.equal(bytes32ToString(result[0]), testCase[i].name);
            assert.equal(result[1].toString(), ExchangeStatusEnabled+'');
        }

        // disable exchange
        for (let i = 0; i < testCase.length; i++) {
            await centralizedExchange.disable(testCase[i].exchangeId);
            result = await centralizedExchange.isEnabled(testCase[i].exchangeId);
            assert.ok(!result);
        }

        // enable exchange
        for (let i = 0; i < testCase.length; i++) {
            result = await centralizedExchange.enable(testCase[i].exchangeId);
            result = await centralizedExchange.isEnabled(testCase[i].exchangeId);
            assert.ok(result);
        }
    })

    it('test getRate', async () => {

        let centralizedExchange = await CentralizedExchange.new();
        let tokens = [];
        for (var i = 0; i < 3; i++) {
            let t = await SimpleERC20Token.new();
            tokens.push(t.address)
        }
        let rates = tokens.map(() => { return expectedRate });

        // supported, but unkown rate
        let t = await SimpleERC20Token.new();
        tokens.push(t.address);
        rates.push(-1);

        let exchangeId = web3.sha3('1');
        await centralizedExchange.addExchange(exchangeId, 'shipeshift');

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

        let centralizedExchange = await CentralizedExchange.new();
        let simpleToken = await SimpleERC20Token.new();
        let exchangeId = web3.sha3('1');
        let token = simpleToken.address;
        let srcAmount = web3.toWei(1, 'ether');
        let deposit = accounts[1];
        await centralizedExchange.addExchange(exchangeId, 'shipeshift');
        let orderIdOffset = 1000000;

        let result = await centralizedExchange.placeOrder(exchangeId, token, srcAmount, expectedRate, deposit);
        let orderInfo = result.logs.find((r)=>{return r.event == 'PlacedOrder';});

        assert.equal(orderInfo.args.exchangeId, exchangeId);
        assert.equal(orderInfo.args.orderId.toString(), orderIdOffset++ + '');
    })
})


