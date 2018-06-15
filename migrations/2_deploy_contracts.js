const KyberConfig = require('../scripts/libs/kyber_config');
const args = require('../scripts/libs/args')
let RiskControl = artifacts.require("RiskControl");


function deployOnMainnet(deployer) {
  let kyberNetwork = '0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e';
  let permissionProviderAddress = '0x402d3bf5d448871810a3ec8a33fb6cc804f9b26e';
  let coreAddress = '0xd332692cf20cbc3aa39abf2f2a69437f22e5beb9';
  let preDepositETH = 0.1;
}

function deployOnKovan(deployer, num) {

}

module.exports = function (deployer, network) {

  let flags = args.parseArgs();

  if (network == 'mainnet' && flags.contract == "exchange") {
    return deployOnMainnet(deployer, network);
  } else if (network == 'kovan') {
    return deployOnKovan(deployer, network);
  }

  return deployer.then(() => {
    return deployer.deploy(RiskControl);
  });
}
