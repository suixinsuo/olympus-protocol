'use strict'
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "hello world hello worl hello worl hello worl hello worl hello worl";
var provider = new HDWalletProvider(mnemonic, "https://kovan.infura.io/Y1CDy31MpG0TX8eNqvfb");
// console.log(provider.wallet["_privKey"].toString("hex"));

//address: 0x0b23B055bC2e28BA0Bf91854585e8433755162a2
//private key: a38e8e1e5f887b8bc0c31fb4f2b7f3eab9c08d7b360dec6a005149c5ff3bb3ee

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    mainnet: {
      provider: provider,
      network_id: '1'
    },
    kovan: {
      provider: provider,
      network_id: '42'
    },
  }
};