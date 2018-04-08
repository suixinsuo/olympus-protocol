const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
const args = require('../libs/args')

module.exports = function (callback, network) {

    let flags = args.parseArgs();
    var method = flags["method"];

    if (method === 'buy') {
        ExchangeProviderWrap.deployed()
            .then(instance => {
                return instance.buy(2, ["0xea1887835d177ba8052e5461a269f42f9d77a5af", "0xec88a5050c63bb9e073afc78b3b9378d0eb53257"], ["50000000000000000", "50000000000000000"], ["95221880092296042468", "2230117946388369312361"], "0xB878496B5a59c9AE84018F9846aB00419Bf0e682", { value: web3.toWei(0.1) });
            })
            .then(function (result) {
                console.log(JSON.stringify(result));
            })
            .catch((reason) => {
                console.log("ExchangeProviderWrap.deployed failed",reason);
            });
    } else if (method === 'deposit') {
        KyberNetworkExchange.deployed().then(instance => {
            instance.send(web3.toWei(0.1, "ether")).then(r => {
                console.log(r.tx);

            }).catch((res)=>{
            })
        });
    } else {
        console.log("no method found, please !");
    }
}
