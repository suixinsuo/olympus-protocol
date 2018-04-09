const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const KyberNetworkExchange = artifacts.require("KyberNetworkExchange");
const SimpleERC20Token = artifacts.require("SimpleERC20Token");
const MockKyberNetwork = artifacts.require("MockKyberNetwork");
const args = require('../libs/args')
const KyberConfig = require('../libs/kyber_config');

function buyOnDev() {

    MockKyberNetwork.deployed().then(instance => {
        return instance.supportedTokens();
    }).then(tokens => {
        console.log(tokens);
        ExchangeProviderWrap.deployed().then(instance => {
            let orderId = new Date().getTime();
            let amounts = tokens.map(t => { return '50000000000000000'; });
            let rates = tokens.map(t => { return '10000000000000000000'; });
            let value = 0.05 * tokens.length;
            let destAddress = '0xB878496B5a59c9AE84018F9846aB00419Bf0e682';
            return instance.buy(orderId, tokens, amounts, rates, destAddress, { value: web3.toWei(value) });
        }).then(res => {
            console.log(JSON.stringify(res));
        }).catch(e => {
            console.log(e);
        })
    })
}

module.exports = function (callback) {

    let flags = args.parseArgs();

    let method = flags["method"];
    let network = flags['network'] || 'development';
    let isMockKyber = flags['mockkyber'];
    let currentAccount = network === 'development' ? '0x627306090abaB3A6e1400e9345bC60c78a8BEf57' : web3._requestManager.provider.address;
    let kyberNetwork = KyberConfig[network];

    if (method === 'buy') {
        if (network == 'development' || isMockKyber) {
            return buyOnDev();
        }
        ExchangeProviderWrap.deployed()
            .then(instance => {
                let orderId = new Date().getTime();
                let tokens = kyberNetwork.tokens;
                let amounts = tokens.map(() => { return '50000000000000000'; });
                let rates = kyberNetwork.rates;
                let deposit = currentAccount;
                return instance.buy(orderId, tokens, amounts, rates, deposit, { value: web3.toWei(0.05 * tokens.length) });
            })
            .then(function (result) {
                console.log(JSON.stringify(result));
            })
            .catch((reason) => {
                console.log("ExchangeProviderWrap.deployed failed", reason);
            });

    } else if (method === 'deposit') {
        var tokensTotal =  kyberNetwork.mockTokenNum;
        if (!isMockKyber && network != "development") {
            tokensTotal = kyberNetwork.tokens.length;
        }

        KyberNetworkExchange.deployed().then(instance => {
            instance.send(web3.toWei(0.05 * tokensTotal, "ether")).then(r => {
                console.log(r.tx);
            }).catch((res) => { })
        });
    } else {
        console.log("no method found, please !");
    }
}
