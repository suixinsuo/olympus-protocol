//
/*
测试
1. 测试提交Token
2. 测试提交交易所
3. 测试提交TokenProvider
4. 测试更新价格 循环
5. 测试获取价格
*/

// contract PriceProviderInterface {

//     function updatePrice(address _tokenAddress,bytes32[] _exchanges,uint[] _prices,uint _nonce) public returns(bool success);

//     function getNewDefaultPrice(address _tokenAddress) public view returns(uint);

//     function getNewCustomPrice(address _provider,address _tokenAddress) public view returns(uint);

//     function GetNonce(address providerAddress,address tokenAddress) public view returns(uint);

//     function checkTokenSupported(address tokenAddress)  public view returns(bool success);

//     function checkExchangeSupported(bytes32 Exchanges)  public view returns(bool success);

//     function checkProviderSupported(address providerAddress,address tokenAddress)  public view returns(bool success);

// }

const PriceProvider = artifacts.require("../contracts/price/PriceProvider");
const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange");

// const Web3 = require('web3');
// const web3 = new Web3();
const _ = require('lodash');
const Promise = require('bluebird');
const mockData = {
  tokenNum: 3,
  id: 0,
  name: "Price",
  description: "Test PriceProvider",
  category: "multiple",
  tokenAddresses: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  exchangesAddressHash: ["0x6269626f78", "0x1269626f78"],
  //providerAddresses: [accounts[2],accounts[3]],
  tokenOnePrice: [1000000, 20000],
  tokenTwoPrice: [3000000, 40000]
}


const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');

const OrderStatusPending = 0;
const OrderStatusApproved = 1;
const OrderStatusCompleted = 2;
const OrderStatusCancelled = 3;
const OrderStatusErrored = 4;

contract('PriceProvider', (accounts) => {

  it("They should be able to deploy.", () => {
    return Promise.all([
      PriceProvider.deployed(),
      //Strategy.deployed(),
      // Exchange.deployed(),
    ]).spread((/*price, strategy, exchange,*/ core) => {
      assert.ok(core, 'PriceProvider contract is not deployed.');
    });
  });

  it("Should be able to set kyber.", async () => {
    let instance = await PriceProvider.deployed();
    let result = await instance.setKyber(accounts[0], { from: accounts[0] });
    assert.equal(result.receipt.status, '0x1');
  })

  it("Should be able to update supported price.", async () => {
    let instance = await PriceProvider.deployed();
    let result = await instance.changeTokens(mockData.tokenAddresses, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x1');
  })
  it("Should be able to check supported price.", async () => {
    let instance = await PriceProvider.deployed();
    let result1 = await instance.checkTokenSupported.call(mockData.tokenAddresses[0], { from: accounts[0] });
    let result2 = await instance.checkTokenSupported.call(mockData.tokenAddresses[1], { from: accounts[0] });
    let result3 = await instance.checkTokenSupported.call(accounts[0], { from: accounts[0] });
    assert.equal(result1, true);
    assert.equal(result2, true);
    assert.equal(result3, false);
  })


  it("Should be able to update supported exchanges.", async () => {
    let instance = await PriceProvider.deployed();
    let result = await instance.changeExchanges(mockData.exchangesAddressHash, { from: accounts[0] });
    assert.equal(result.receipt.status, '0x1');
  })

  it("Should be able to check supported exchanges.", async () => {
    let instance = await PriceProvider.deployed();
    let result1 = await instance.checkExchangeSupported.call(mockData.exchangesAddressHash[0], { from: accounts[0] });
    let result2 = await instance.checkExchangeSupported.call(mockData.exchangesAddressHash[1], { from: accounts[0] });
    let result3 = await instance.checkExchangeSupported.call(accounts[0], { from: accounts[0] });
    assert.equal(result1, true);
    assert.equal(result2, true);
    assert.equal(result3, false);
  })

  it("Should be able to update supported Provider.", async () => {
    let instance = await PriceProvider.deployed();
    let result1 = await instance.changeProviders([accounts[1], accounts[2]], mockData.tokenAddresses[0], { from: accounts[0] });
    let result2 = await instance.changeProviders([accounts[2], accounts[1]], mockData.tokenAddresses[1], { from: accounts[0] });
    assert.equal(result1.receipt.status, '0x1');
    assert.equal(result2.receipt.status, '0x1');
  })

  it("Should be able to check supported provider.", async () => {
    let instance = await PriceProvider.deployed();
    let result1 = await instance.checkProviderSupported.call(accounts[1], mockData.tokenAddresses[0], { from: accounts[0] });
    let result2 = await instance.checkProviderSupported.call(accounts[2], mockData.tokenAddresses[0], { from: accounts[0] });
    let result3 = await instance.checkProviderSupported.call(accounts[3], mockData.tokenAddresses[0], { from: accounts[0] });
    let result4 = await instance.checkProviderSupported.call(accounts[1], mockData.tokenAddresses[1], { from: accounts[0] });
    let result5 = await instance.checkProviderSupported.call(accounts[2], mockData.tokenAddresses[1], { from: accounts[0] });
    let result6 = await instance.checkProviderSupported.call(accounts[3], mockData.tokenAddresses[1], { from: accounts[0] });
    assert.equal(result1, true);
    assert.equal(result2, true);
    assert.equal(result3, false);
    assert.equal(result4, true);
    assert.equal(result5, true);
    assert.equal(result6, false);
  })
  it("Should be able to update price.", async () => {
    let instance = await PriceProvider.deployed();
    let nonce1 = 0;
    let nonce2 = 0;
    let result1 = await instance.updatePrice(mockData.tokenAddresses[0], mockData.exchangesAddressHash, mockData.tokenOnePrice, nonce1, { from: accounts[1] });
    nonce1 = + 1;
    let result2 = await instance.updatePrice(mockData.tokenAddresses[0], mockData.exchangesAddressHash, mockData.tokenTwoPrice, nonce2, { from: accounts[2] });
    nonce2 = + 1;
    let result3 = await instance.updatePrice(mockData.tokenAddresses[0], mockData.exchangesAddressHash, mockData.tokenTwoPrice, nonce1, { from: accounts[1] });

    let result4 = await instance.updatePrice(mockData.tokenAddresses[0], mockData.exchangesAddressHash, mockData.tokenOnePrice, nonce2, { from: accounts[2] });
    assert.equal(result1.receipt.status, '0x1');
    assert.equal(result2.receipt.status, '0x1');
    assert.equal(result3.receipt.status, '0x1');
    assert.equal(result4.receipt.status, '0x1');
  });

  it("Should be able to check price.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.getNewDefaultPrice.call(mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result1.c[0], mockData.tokenTwoPrice[0]);
    let result2 = await instance.getNewCustomPrice.call(accounts[2], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result2.c[0], mockData.tokenOnePrice[0]);
  });
  it("Should be able to get nonce.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.getNonce.call(accounts[1], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result1.c[0], 2);
    let result2 = await instance.getNonce.call(accounts[2], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result2.c[0], 2);
  });

  it("Should be able to checkTokenSupported.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.checkTokenSupported.call(mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result1, true);
    let result2 = await instance.checkTokenSupported.call(accounts[2], { from: accounts[0] });
    assert.equal(result2, false);
  });

  it("Should be able to checkExchangeSupported.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.checkExchangeSupported.call(mockData.exchangesAddressHash[0], { from: accounts[0] });
    assert.equal(result1, true);
    let result2 = await instance.checkExchangeSupported.call(accounts[2], { from: accounts[0] });
    assert.equal(result2, false);
  });

  it("Should be able to checkProviderSupported.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.checkProviderSupported.call(accounts[1], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result1, true);
    let result2 = await instance.checkProviderSupported.call(accounts[3], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result2, false);
  });
  it("Should be able to changeDefaultProvider.", async () => {
    let instance = await PriceProvider.deployed();

    let result1 = await instance.changeDefaultProviders(accounts[4], mockData.tokenAddresses[0], { from: accounts[0] });
    assert.equal(result1.receipt.status, '0x1');
  });

});
