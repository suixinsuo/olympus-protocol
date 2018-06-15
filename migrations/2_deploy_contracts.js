'use strict';

const KyberConfig = require('../scripts/libs/kyber_config');
// let KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
let ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
let ExchangeProvider = artifacts.require("ExchangeProvider");
let ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
let MarketplaceProvider = artifacts.require("MarketPlace");
let DummyDerivative = artifacts.require("DummyDerivative")

let MockKyberNetwork = artifacts.require("MockKyberNetwork");
let SimpleERC20Token = artifacts.require("SimpleERC20Token");
let CentralizedExchange = artifacts.require("CentralizedExchange");



const args = require('../scripts/libs/args')
let RiskControl = artifacts.require("RiskControl");


function deployOnDev(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  })

  // .then(() => {
  //   return deployer.deploy(MockKyberNetwork, num, 18);
  // }).then(() => {
  //   return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(KyberNetworkExchange, MockKyberNetwork.address, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(CentralizedExchange, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
  // }).then(() => {
  //   return deployer.deploy(FundTemplate, 'test_symbol', 'test_name', 18);
  // }).then(() => {
  //   return deployer.deploy(TestReimbursable);
  // })
}

function deployOnKovan(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  }).then((err, result) => {
    return deployer.deploy(DummyDerivative, MarketplaceProvider.address);
  });
}


// function deployOnMainnet(deployer) {

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
// }

function deployOnKovan(deployer, num) {

  return deployer.then(() => {
    return deployer.deploy(ExchangeAdapterManager, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, PermissionProvider.address);
    // }).then(() => {
    //   return deployer.deploy(KyberNetworkExchange, kyberNetwork.network, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
  }).then(() => {
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
  deployOnDev(deployer, network);
  // return deployer.then(() => {
  //   return deployExchangeProviderWrap(deployer, network);
  // })
  // return deployer.then(() => {
  //   return deployer.deploy(PermissionProvider);
  // }).then(() => {
  //   return deployer.deploy(RebalanceMock);
  // }).then((err, result) => {
  //   return deployer.deploy(Core, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(StrategyProvider, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(PriceProvider, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(ExtendedStorage, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(OlympusStorage, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(TokenizationProvider, PermissionProvider.address);
  // }).then(() => {
  //   return deployer.deploy(RiskManagement, PermissionProvider.address);
  // }).then(() => {
  //   return deployExchangeProviderWrap(deployer, network);
  // })
}

  return deployer.then(() => {
    return deployer.deploy(RiskControl);
  });
}
