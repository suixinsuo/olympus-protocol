var HDWalletProvider = require("truffle-hdwallet-provider");
var prompt = require("prompt-sync")();

var mnemonics = {};

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gasPrice: 1000000000
      // gas: 7600000
    },
    kovan: {
      provider: function() {
        mnemonics.kovan = process.env.MNEMONICS || mnemonics.kovan || prompt("network kovan mnemonic: ");
        return new HDWalletProvider(mnemonics.kovan, "https://kovan.infura.io/qajYHKaGssZt5WrdfzGP");
      },
      gasPrice: 2000000000,
      before_timeout: 200000,
      test_timeout: 300000,
      network_id: 42
    },
    mainnet: {
      provider: function() {
        mnemonics.mainnet = process.env.MNEMONICS || mnemonics.mainnet || prompt("network mainnet mnemonic: ");
        return new HDWalletProvider(mnemonics.mainnet, "https://mainnet.infura.io/qajYHKaGssZt5WrdfzGP");
      },
      gasPrice: 1000000000,
      network_id: 1
    }
  },
  solc: { optimizer: { enabled: true, runs: 200 } },
  mocha: {
    // reporter: 'eth-gas-reporter',
    // reporterOptions: {
    //   currency: 'CNY',
    //   gasPrice: 2
    // }
  }
};
