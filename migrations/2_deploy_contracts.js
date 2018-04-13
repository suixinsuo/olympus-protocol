var Core = artifacts.require("./OlympusLabsCore.sol");
var StrategyProvider = artifacts.require("./strategy/StrategyProvider.sol");
var PermissionProvider = artifacts.require("./permission/PermissionProvider.sol");
var PriceProvider = artifacts.require("./price/PriceProvider.sol");
var ExtendedStorage = artifacts.require("./storage/OlympusStorageExtended.sol")
var OlympusStorage = artifacts.require("./storage/OlympusStorage.sol");
let premissionInstance;


const KyberConfig = require('../scripts/libs/kyber_config');
var KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
var ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
var ExchangeProvider = artifacts.require("ExchangeProvider");
var ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
var MockKyberNetwork = artifacts.require("MockKyberNetwork");
var SimpleERC20Token = artifacts.require("SimpleERC20Token");
const args = require('../scripts/libs/args')

function deployOnDev(deployer, num) {

    deployer.then(() => {
        return deployer.deploy(MockKyberNetwork, num);
    }).then(() => {
        return deployer.deploy(KyberNetworkExchange, MockKyberNetwork.address);
    }).then(() => {
        return deployer.deploy(ExchangeAdapterManager, KyberNetworkExchange.address);
    }).then(() => {
        return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address);
    }).then(() => {
        return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
    })
}

function deployExchangeProviderWrap(deployer, network) {

    let kyberNetwork = KyberConfig[network];
    if (network === 'development'){
        return deployOnDev(deployer, kyberNetwork.mockTokenNum);
    }

    let flags = args.parseArgs();
    var isMockKyber = flags["mockkyber"];
    if(isMockKyber){
        return deployOnDev(deployer, kyberNetwork.mockTokenNum);
    }

    if (!kyberNetwork) {
        console.error("unkown kyberNetwork address", network)
        return;
    }

    deployer.then(() => {
        return deployer.deploy(KyberNetworkExchange, kyberNetwork.network);
    }).then(() => {
        return deployer.deploy(ExchangeAdapterManager, KyberNetworkExchange.address);
    }).then(() => {
        return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address);
    }).then(() => {
        return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
    })
}

module.exports = function (deployer, network) {

  deployer.then(() => {
    premissionInstance = deployer.deploy(PermissionProvider);
    return premissionInstance;
  }).then(() => {
    return deployer.deploy(StrategyProvider, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(PriceProvider, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(Core, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(ExtendedStorage, PermissionProvider.address);
  }).then(() => {
    return deployer.deploy(OlympusStorage, PermissionProvider.address);
  }).then(() => {
    return deployExchangeProviderWrap(deployer, network);
  })
  
}
