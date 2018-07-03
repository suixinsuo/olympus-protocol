'use strict';

const KyberConfig = require('../scripts/libs/kyber_config');

let ExchangeProvider = artifacts.require("ExchangeProvider");
let ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
let KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter.sol");
let MockKyberNetwork = artifacts.require("MockKyberNetwork");

let MarketplaceProvider = artifacts.require("Marketplace");
let AsyncWithdraw = artifacts.require("AsyncWithdraw");
let SimpleWithdraw = artifacts.require("SimpleWithdraw");
let Reimbursable = artifacts.require("Reimbursable");

let DummyDerivative = artifacts.require("MockDerivative");
let PercentageFee = artifacts.require("PercentageFee");

const args = require('../scripts/libs/args')
let RiskControl = artifacts.require("RiskControl");
let WhiteListProvider = artifacts.require("WhiteListProvider");

let MockIndex = artifacts.require("MockIndex");
// let MockWhiteListClient = artifacts.require("MockWhiteListClient");

let RebalanceProvider = artifacts.require("RebalanceProvider");
let MockRebalanceIndex = artifacts.require("MockRebalanceIndex");
// let MockFund = artifacts.require("MockFund");
let OlympusFund = artifacts.require('OlympusFund');

let devTokens;
function deployMarketplace(deployer, network) {
  deployer.deploy([
    MarketplaceProvider,
  ]);
}

function deployWithdraw(deployer, network) {
  deployer.deploy([
    AsyncWithdraw,
    SimpleWithdraw,
  ]);
}

function deployWhitelist(deployer, network) {
  deployer.deploy([
    WhiteListProvider,
  ]);
}

function deployExchange(deployer, network) {
  let kyberNetwork = KyberConfig[network];
  let kyberAddress = network === 'kovan' ? '0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42E50' : '0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e';
  return deployer.then(() => {
    return deployer.deploy(ExchangeAdapterManager);
  }).then(() => {
    return deployer.deploy(KyberNetworkAdapter, kyberAddress, ExchangeAdapterManager.address);
  }).then(() => {
    return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address);
  }).then(() => {
    if (network === 'development') {
      return deployer.deploy(MockKyberNetwork, kyberNetwork.mockTokenNum, 18);
    }
  }).then(async () => {
    let kyberNetworkAdapter = await KyberNetworkAdapter.deployed();
    let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
    if (network === 'development') {
      let mockKyberNetwork = await MockKyberNetwork.deployed();
      devTokens = await mockKyberNetwork.supportedTokens();
      await kyberNetworkAdapter.configAdapter(mockKyberNetwork.address, 0x0);
    }
    await exchangeAdapterManager.addExchange("kyber", kyberNetworkAdapter.address);
    return deployer;
  });
}

async function deployMockfund(deployer, network) {
  deployer.deploy([
    SimpleWithdraw, // Exchannge Provider
  ]);
  await deployExchange(deployer, network);

}

async function deployReimbursable(deployer, network) {
  deployer.deploy([
    Reimbursable,
  ]);
}

async function deployOlympusFund(deployer, network) {
  const args = args.parseArgs();

  if (network === 'kovan') {
    // Not tested
    if (args.name && args.symbol) {
      await deployer.deploy(OlympusFund, args.name, args.symbol, 'Created by automatic deployment', 18);
      const fund = OlympusFund.deployed;
      await fund.initialize(
        0xfe818847198201ef8d800809d40f0c504f7d9a8c, // Market
        0x304730f75cf4c92596fc61cc239a649febc0e36e, // Exchange
        0x035b67efd86462356d104e52b6975f7d2bfe198c, // Withdraw
        0x1, // Risk
        0x1111111111111111111111111111111111111111, // whitelist
        0x5b81830a3399f29d1c2567c7d09376503b607058, // Reimbursable
        0x4dc61e1e74eec68e32538cf2ef5509e17e0fc2bc, // Managment fee
        1000 // 1%
      );
    }
    else {
      console.error('Required name and symbol as parametter');
    }
    return;
  }
  await deployer.deploy([
    AsyncWithdraw,
    SimpleWithdraw, // Exchannge Provider
    RiskControl,
    MarketplaceProvider,
    PercentageFee,
    Reimbursable,
    WhiteListProvider,
  ]);
  await deployExchange(deployer, network);
}

// Running all the suits
function deployOnDev(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy([
      MarketplaceProvider,
      AsyncWithdraw,
      RiskControl,
      SimpleWithdraw,
      PercentageFee,
      Reimbursable,
      WhiteListProvider,
    ]);
  }).then(() => {
    return deployExchange(deployer, 'development');
  }).then(() => {
    return deployer.deploy(RebalanceProvider, ExchangeProvider.address);
  }).then(() => {
    return deployer.deploy(MockRebalanceIndex, devTokens, [50, 50], RebalanceProvider.address, ExchangeProvider.address);
  });
}

function deployOnKovan(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy([
      MarketplaceProvider,
      AsyncWithdraw,
      RiskControl,
      DummyDerivative,
    ]);
  }).then(() => {
    return deployExchange(deployer, 'kovan');
  }).then(() => {
    return deployer.deploy(RebalanceProvider, ExchangeProvider.address);
  }).then(() => {
    return deployer.deploy(MockRebalanceIndex, ['0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a', '0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b'], [50, 50], RebalanceProvider.address, ExchangeProvider.address);
  });
}


function deployOnMainnet(deployer) {

  //   let kyberNetwork = '0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e';
  //   let permissionProviderAddress = '0x402d3bf5d448871810a3ec8a33fb6cc804f9b26e';
  //   let coreAddress = '0xd332692cf20cbc3aa39abf2f2a69437f22e5beb9';
  //   let preDepositETH = 0.1;

  //   let deploy = deployer.then(() => {
  //     return deployer.deploy(ExchangeAdapterManager, permissionProviderAddress);
  //   }).then(() => {
  //     return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, permissionProviderAddress);
  //   }).then(() => {
  //     return deployer.deploy(KyberNetworkExchange, kyberNetwork, ExchangeAdapterManager.address, ExchangeProvider.address, permissionProviderAddress);
  //   }).then(async () => {

  //     let kyberExchangeInstance = await KyberNetworkExchange.deployed();
  //     let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
  //     let exchangeProvider = await ExchangeProvider.deployed();

  //     console.info(`adding kyberExchange ${kyberExchangeInstance.address}`);
  //     let result = await exchangeAdapterManager.addExchange('kyber', kyberExchangeInstance.address);

  //     console.info(`send ${preDepositETH} ether to kyberExchange`);
  //     let r = await kyberExchangeInstance.send(web3.toWei(preDepositETH, "ether"));

  //     console.info('exchange provider set core');
  //     await exchangeProvider.setCore(coreAddress);
  //   })
  //   return deploy;
}

module.exports = function (deployer, network) {
  let flags = args.parseArgs();


  if (flags.suite && typeof eval(`deploy${flags.suite}`) === 'function') {
    return eval(`deploy${flags.suite}(deployer,network)`);
  }


  if (network == 'mainnet' && flags.contract == "exchange") {
    return deployOnMainnet(deployer, network);
  } else if (network == 'kovan') {
    return deployOnKovan(deployer, network);
  }


  return deployOnDev(deployer, network);

}
