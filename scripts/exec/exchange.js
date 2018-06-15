const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const KyberNetworkAdapter = artifacts.require("KyberNetworkAdapter");
const ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
const SimpleERC20Token = artifacts.require("SimpleERC20Token");
const MockKyberNetwork = artifacts.require("MockKyberNetwork");
const CentralizedExchange = artifacts.require("CentralizedExchange");
const ExchangeProvider = artifacts.require("ExchangeProvider");

const args = require('../libs/args')
const KyberConfig = require('../libs/kyber_config');


function buyOnDev() {
  (async () => {

    let mockkyber = await MockKyberNetwork.deployed();
    let tokens = await mockkyber.supportedTokens();
    let exchangeProviderWrap = await ExchangeProviderWrap.deployed();

    let orderId = new Date().getTime();
    let amounts = tokens.map(t => { return web3.toWei(0.5, 'ether') });
    let rates = tokens.map(t => { return web3.toWei(1000, 'ether'); });
    let value = 0.5 * tokens.length;
    let destAddress = '0xB878496B5a59c9AE84018F9846aB00419Bf0e682';
    await exchangeProviderWrap.buy(orderId, tokens, amounts, rates, destAddress, { value: web3.toWei(value) });
    // console.log(JSON.stringify(result));
  })()
}

module.exports = function (callback) {

  let flags = args.parseArgs();

  let method = flags["method"];
  let network = flags['network'] || 'development';
  let isMockKyber = flags['mockkyber'];
  let currentAccount = network === 'development' ? '0x627306090abaB3A6e1400e9345bC60c78a8BEf57' : web3._requestManager.provider.address;
  let kyberNetwork = KyberConfig[network];

  if (method === 'buy') {
    if (network == 'development' || isMockKyber) {
      return buyOnDev();
    }
    ExchangeProviderWrap.deployed()
      .then(instance => {
        let orderId = new Date().getTime();
        let tokens = kyberNetwork.tokens;
        let amounts = tokens.map(() => { return '50000000000000000'; });
        let rates = kyberNetwork.rates;
        let deposit = currentAccount;
        return instance.buy(orderId, tokens, amounts, rates, deposit, { value: web3.toWei(0.05 * tokens.length) });
      })
      .then(function (result) {
        console.log(JSON.stringify(result));
      })
      .catch((reason) => {
        console.log("ExchangeProviderWrap.deployed failed", reason);
      });

  } else if (method === 'deposit') {
    var tokensTotal = kyberNetwork.mockTokenNum;
    if (!isMockKyber && network != "development") {
      tokensTotal = kyberNetwork.tokens.length;
    }

    KyberNetworkAdapter.deployed().then(instance => {
      instance.send(web3.toWei(0.05 * tokensTotal, "ether")).then(r => {
        console.log(r.tx);
      }).catch((res) => { })
    });
  } else if (method === 'setupCentralized') {
    (async () => {
      let centralizedExchange = await CentralizedExchange.deployed();
      let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
      result = await exchangeAdapterManager.addExchange('bibox', centralizedExchange.address);
      log = result.logs.find(l => { return l.event == 'AddedExchange' });
      let biboxId = log.args.id;
      console.info(`Added bibox exchange: id = ${biboxId}`);

      let mockKyberNetwrok = await MockKyberNetwork.deployed();
      let tokens = await mockKyberNetwrok.supportedTokens();
      let rates = tokens.map(t => { return web3.toWei(1000, 'ether') });
      await centralizedExchange.setRates(biboxId, tokens, rates);
      let exchangeProvider = await ExchangeProvider.deployed();
      await centralizedExchange.setAdapterOrderCallback(exchangeProvider.address);
    })()
  } else if (method === 'setupKyber') {

    // addKyber and deposit
    (async () => {
      let kyberExchangeInstance = await KyberNetworkAdapter.deployed();
      let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
      let result = await exchangeAdapterManager.addExchange('kyber', kyberExchangeInstance.address);
      let log = result.logs.find(l => { return l.event == 'AddedExchange' });
      console.info(`Added kyber exchange: id = ${log.args.id}`);
      let r = await kyberExchangeInstance.send(web3.toWei(0.5, "ether"));
      console.log(r.tx);
    })()

  } else if (method === 'withdraw') {
    (async () => {
      let kyberExchangeInstance = await KyberNetworkAdapter.deployed();
      await kyberExchangeInstance.withdraw(0);
    })()
  } else {
    console.log("no method found, please !");
  }
}
