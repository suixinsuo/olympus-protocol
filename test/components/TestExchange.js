const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const KyberNetworkExchange = artifacts.require("../contracts/components/exchange/exchanges/KyberNetworkExchange");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token");
const ExchangeAdapterManager = artifacts.require("../contracts/components/exchange/ExchangeAdapterManager");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
// const PermissionProvider = artifacts.require("../contracts/components/permission/PermissionProvider");
const ExchangeProviderWrap = artifacts.require("ExchangeProviderWrap");
const CentralizedExchange = artifacts.require("CentralizedExchange");

const tokensLenght = 2;
const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const expectedRateToSell = web3.toBigNumber('1000000000000000');
const BigNumber = web3.BigNumber;

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, '');
}

const Promise = require('bluebird');

contract('MockKyberNetwork', (accounts) => {
    it("MockKyberNetwork should be able to trade.", async () => {

    })
});

