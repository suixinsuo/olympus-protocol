'use strict';

// const KyberConfig = require('../scripts/libs/kyber_config');

let MarketplaceProvider = artifacts.require("MarketPlace");
let DummyDerivative = artifacts.require("DummyDerivative");

const args = require('../scripts/libs/args')
let RiskControl = artifacts.require("RiskControl");


function deployOnDev(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  }).then(() => {
    return deployer.deploy(RiskControl);
  });
}

function deployOnKovan(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  }).then((err, result) => {
    return deployer.deploy(DummyDerivative, MarketplaceProvider.address);
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

function deployOnKovan(deployer, num) {

  return deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  })
}

module.exports = function (deployer, network) {

  let flags = args.parseArgs();

  if (network == 'mainnet' && flags.contract == "exchange") {
    return deployOnMainnet(deployer, network);
  } else if (network == 'kovan') {
    return deployOnKovan(deployer, network);
  }
  return deployOnDev(deployer, network);

}



