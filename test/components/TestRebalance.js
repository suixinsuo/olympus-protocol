const ERC20Extended = artifacts.require("../contracts/libs/ERC20Extended");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const RebalanceProvider = artifacts.require("../contracts/components/rebalance/RebalanceProvider");
const MockRebalanceIndex = artifacts.require("../contracts/components/mocks/MockRebalanceIndex.sol");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");

const tokensLength = 2;
const expectedRate = web3.toBigNumber('1000' + '000000000000000000');
const BigNumber = web3.BigNumber;

const Promise = require('bluebird');

contract('MockRebalanceIndex', (accounts) => {
  let tokens;
  let exchangeProvider;
  let rebalanceProvider;
  let mockRebalanceIndex;
  const deposit = accounts[0];
  before(async () => {
    return await Promise.all([
      ExchangeProvider.deployed(),
      RebalanceProvider.deployed(),
      MockRebalanceIndex.deployed(),
      MockKyberNetwork.deployed(),
    ]).spread(async (_exchangeProvider, _rebalanceProvider, _mockRebalanceIndex, _mockKyberNetwork) => {
      assert.ok(_mockKyberNetwork, 'MockKyberNetwork contract is not deployed.');
      assert.ok(_mockRebalanceIndex, 'MockRebalanceIndex contract is not deployed.');
      assert.ok(_rebalanceProvider, 'RebalanceProvider contract is not deployed.');
      assert.ok(_exchangeProvider, 'ExchangeProvider contract is not deployed.');
      tokens = await _mockKyberNetwork.supportedTokens();
      const erc20Token = await ERC20Extended.at(tokens[0]);
      erc20Token.transfer(_mockRebalanceIndex.address, await erc20Token.balanceOf(accounts[0]));
      exchangeProvider = _exchangeProvider;
      rebalanceProvider = _rebalanceProvider;
      mockRebalanceIndex = _mockRebalanceIndex;

    });
  });

  it("MockRebalanceIndex should be able to rebalance tokens.", async () => {
    let result = await mockRebalanceIndex.rebalance();
    console.log(result);
    // throw 0;
  });
});
