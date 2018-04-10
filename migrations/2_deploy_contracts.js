var Core = artifacts.require("./OlympusLabsCore.sol");
var StrategyProvider = artifacts.require("./strategy/StrategyProvider.sol");
//var ExchangeProvider = artifacts.require("./exchange/ExchangeProvider.sol");
var PriceProvider = artifacts.require("./price/PriceProvider.sol");
var ExtendedStorage = artifacts.require("./storage/OlympusStorageExtended.sol")
var OlympusStorage = artifacts.require("./storage/OlympusStorage.sol");
module.exports = function (deployer) {
  deployer.deploy(Core);
  deployer.deploy(StrategyProvider);
  //deployer.deploy(ExchangeProvider);
  deployer.deploy(PriceProvider);
  deployer.deploy(ExtendedStorage);
  deployer.deploy(OlympusStorage);
}
