var Core = artifacts.require("./OlympusLabsCore.sol");
var StrategyProvider = artifacts.require("./strategy/StrategyProvider.sol");
var PermissionProvider = artifacts.require("./permission/PermissionProvider.sol");
var PriceProvider = artifacts.require("./price/PriceProvider.sol");
var ExtendedStorage = artifacts.require("./storage/OlympusStorageExtended.sol")
var OlympusStorage = artifacts.require("./storage/OlympusStorage.sol");
let premissionInstance, coreInstance;

const KyberConfig = require('../scripts/libs/kyber_config');
var KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
var ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
var ExchangeProvider = artifacts.require("ExchangeProvider");
var ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
var MockKyberNetwork = artifacts.require("MockKyberNetwork");
var SimpleERC20Token = artifacts.require("SimpleERC20Token");
var CentralizedExchange = artifacts.require("CentralizedExchange.sol");
const args = require('../scripts/libs/args')

function deployOnDev(deployer, num) {
  return deployer.then(() => {
    return deployer.deploy(ExchangeAdapterManager, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(MockKyberNetwork, num, 18);
  }).then(() => {
    return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(KyberNetworkExchange, MockKyberNetwork.address, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(CentralizedExchange, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
  })
}

function deployOnMainnet(deployer) {

  let kyberNetwrok = '0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e';
  let permissionProviderAddress = '0x402d3bf5d448871810a3ec8a33fb6cc804f9b26e';
  let coreAddress = '0xd332692cf20cbc3aa39abf2f2a69437f22e5beb9';
  let preDepositETH = 0.1;

  let deploy = deployer.then(() => {
    return deployer.deploy(ExchangeAdapterManager, permissionProviderAddress);
  }).then(() => {
    return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, permissionProviderAddress);
  }).then(() => {
    return deployer.deploy(KyberNetworkExchange, kyberNetwrok, ExchangeAdapterManager.address, ExchangeProvider.address, permissionProviderAddress);
  }).then(async () => {

    let kyberExchangeInstance = await KyberNetworkExchange.deployed();
    let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
    let exchangeProvder = await ExchangeProvider.deployed();

    console.info(`adding kyberExchange ${kyberExchangeInstance.address}`);
    let result = await exchangeAdapterManager.addExchange('kyber', kyberExchangeInstance.address);

    console.info(`send ${preDepositETH} ether to kyberExchange`);
    let r = await kyberExchangeInstance.send(web3.toWei(preDepositETH, "ether"));

    console.info('exchange provider set core');
    await exchangeProvder.setCore(coreAddress);
  })
  return deploy;
}

function deployExchangeProviderWrap(deployer, network) {

  let kyberNetwork = KyberConfig[network];
  if (network === 'development') {
    return deployOnDev(deployer, kyberNetwork.mockTokenNum);
  }

  let flags = args.parseArgs();
  var isMockKyber = flags["mockkyber"];
  if (isMockKyber) {
    return deployOnDev(deployer, kyberNetwork.mockTokenNum);
  }

  if (!kyberNetwork) {
    console.error("unkown kyberNetwork address", network)
    return;
  }

  return deployer.then(() => {
    return deployer.deploy(ExchangeAdapterManager, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(KyberNetworkExchange, kyberNetwork.network, ExchangeAdapterManager.address, ExchangeProvider.address, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
  })
}

module.exports = function (deployer, network) {

  let flags = args.parseArgs();

  if (network == 'mainnet' && flags.contract == "exchange") {
    return deployOnMainnet(deployer, network);
  }

  return deployer.then(() => {
    return deployer.deploy(PermissionProvider);
  }).then((err, result) => {
    return deployer.deploy(Core, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(StrategyProvider, PermissionProvider.address, Core.address);
  }).then(() => {
    return deployer.deploy(PriceProvider, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExtendedStorage, PermissionProvider.address);
  }).then(() => {
    return network === 'development' ?
      deployer.deploy(OlympusStorage, PermissionProvider.address, 0x0) :
      deployer.deploy(OlympusStorage, PermissionProvider.address, Core.address);
  }).then(() => {
    return deployExchangeProviderWrap(deployer, network);
  })
}
