"use strict";

const KyberConfig = require("../scripts/libs/kyber_config");

let ExchangeProvider = artifacts.require("ExchangeProvider");
let ExchangeAdapterManager = artifacts.require("ExchangeAdapterManager");
let KyberNetworkAdapter = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkAdapter.sol");
let MockKyberNetwork = artifacts.require("MockKyberNetwork");

let MarketplaceProvider = artifacts.require("Marketplace");
let AsyncWithdraw = artifacts.require("AsyncWithdraw");
let SimpleWithdraw = artifacts.require("SimpleWithdraw");
let Reimbursable = artifacts.require("Reimbursable");

let PercentageFee = artifacts.require("PercentageFee");
let ComponentList = artifacts.require("ComponentList");

const args = require("../scripts/libs/args");
let RiskControl = artifacts.require("RiskControl");
let WhitelistProvider = artifacts.require("WhitelistProvider");

let MockToken = artifacts.require("MockToken");
let RebalanceProvider = artifacts.require("RebalanceProvider");

let StepProvider = artifacts.require("StepProvider");

let devTokens;

function deployMarketplace(deployer, network) {
  deployer.deploy([MarketplaceProvider]);
}

function deployWithdraw(deployer, network) {
  deployer.deploy([AsyncWithdraw, SimpleWithdraw]);
}

function deployWhitelist(deployer, network) {
  deployer.deploy([WhitelistProvider]);
}
function deployStep(deployer, network) {
  const MockStepContract = artifacts.require("MockStepContract");
  deployer.deploy([StepProvider, MockStepContract]);
}

function deployExchange(deployer, network) {
  let kyberNetwork = KyberConfig[network];
  let kyberAddress =
    network === "kovan" ? "0x65B1FaAD1b4d331Fd0ea2a50D5Be2c20abE42E50" : "0xD2D21FdeF0D054D2864ce328cc56D1238d6b239e";
  return deployer
    .then(() => deployer.deploy(ExchangeAdapterManager))
    .then(() => {
      if (network === "development") {
        return deployer.deploy(MockToken, "", "MOT", 18, 10 ** 9 * 10 ** 18);
      }
    })
    .then(() => deployer.deploy(KyberNetworkAdapter, kyberAddress, ExchangeAdapterManager.address))
    .then(() => deployer.deploy(ExchangeProvider, ExchangeAdapterManager.address))
    .then(() => {
      if (network === "development") {
        return deployer.deploy(MockKyberNetwork, kyberNetwork.mockTokenNum, 18);
      }
    })
    .then(async () => {
      let kyberNetworkAdapter = await KyberNetworkAdapter.deployed();
      let exchangeAdapterManager = await ExchangeAdapterManager.deployed();
      if (network === "development") {
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
    SimpleWithdraw // Exchannge Provider
  ]);
  await deployExchange(deployer, network);
}

async function deployReimbursable(deployer, network) {
  deployer.deploy([Reimbursable]);
}

async function deployOlympusFund(deployer, network) {
  const args = args.parseArgs();
  await deployer.deploy([
    AsyncWithdraw,
    RiskControl,
    MarketplaceProvider,
    PercentageFee,
    Reimbursable,
    WhitelistProvider,
    ComponentList
  ]);
  await deployExchange(deployer, network);
}

async function deployOlympusIndex(deployer, network) {
  const args = args.parseArgs();

  await deployer.deploy([
    AsyncWithdraw,
    RiskControl,
    MarketplaceProvider,
    PercentageFee,
    Reimbursable,
    WhitelistProvider,
    ComponentList
  ]);
  await deployExchange(deployer, network);
  await deployer.deploy(RebalanceProvider, ExchangeProvider.address);
}

// Running all the suits
function deployOnDev(deployer, num) {
  return deployer
    .then(() =>
      deployer.deploy([
        MarketplaceProvider,
        AsyncWithdraw,
        RiskControl,
        SimpleWithdraw,
        PercentageFee,
        Reimbursable,
        WhitelistProvider,
        ComponentList,
        StepProvider,
        [MockToken, "", "MOT", 18, 10 ** 9 * 10 ** 18]
      ])
    )
    .then(() => deployExchange(deployer, "development"))
    .then(() => deployer.deploy(RebalanceProvider, ExchangeProvider.address));
}

function deployOnKovan(deployer, num) {
  return deployer
    .then(() =>
      deployer.deploy([
        MarketplaceProvider,
        AsyncWithdraw,
        RiskControl,
        SimpleWithdraw,
        PercentageFee,
        Reimbursable,
        WhitelistProvider,
        ComponentList,
        [MockToken, "", "MOT", 18, 10 ** 9 * 10 ** 18]
      ])
    )
    .then(() => deployExchange(deployer, "kovan"))
    .then(() => deployer.deploy(RebalanceProvider, ExchangeProvider.address));
}

function deployOnMainnet(deployer) {
  let deploy = deployer.then(() => {
    return deployer.deploy(MarketplaceProvider);
  });
  return deploy;
}

module.exports = function(deployer, network) {
  let flags = args.parseArgs();

  if (flags.suite && typeof eval(`deploy${flags.suite}`) === "function") {
    return eval(`deploy${flags.suite}(deployer,network)`);
  }

  if (network == "mainnet" && flags.contract == "exchange") {
    return deployOnMainnet(deployer, network);
  } else if (network == "kovan") {
    return deployOnKovan(deployer, network);
  }

  return deployOnDev(deployer, network);
};
