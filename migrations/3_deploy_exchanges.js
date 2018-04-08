const KyberConfig = require('../scripts/libs/kyber_config');
var KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
var ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
var ExchangeProvider = artifacts.require("ExchangeProvider");
var ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");

function deployExchangeProviderWrap(deployer, network) {
    let kyberNetwork = KyberConfig[network];
    if (!kyberNetwork) {
        console.error("unkown kyberNetwork address", network);
        return;
    }

    deployer.then(() => {
        return deployer.deploy(KyberNetworkExchange, kyberNetwork.network);;
    }).then(() => {
        return deployer.deploy(ExchangeAdapterManager, KyberNetworkExchange.address);
    }).then(() => {
        return deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address);
    }).then(() => {
        return deployer.deploy(ExchangeProviderWrap, ExchangeProvider.address);
    })
}

module.exports = function (deployer, network) {
    deployExchangeProviderWrap(deployer, network);
};
