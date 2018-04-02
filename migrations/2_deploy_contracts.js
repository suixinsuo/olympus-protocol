// var ConvertLib = artifacts.require("./ConvertLib.sol");
// var MetaCoin = artifacts.require("./MetaCoin.sol");
var Strategy = artifacts.require("./strategy/StrategyProvider.sol");

module.exports = function(deployer) {
  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
  deployer.deploy(Strategy);
};
