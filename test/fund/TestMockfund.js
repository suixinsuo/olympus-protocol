const log = require('../utils/log');
const FundInstance = artifacts.require("../../contracts/components/mocks/MockFund.sol");

const TOKEN1 = 0x0041dee9f481a1d2aa74a3f1d0958c1db6107c686a;
const TOKEN2 = 0x3fb1c5555a04fc478784846296a35d1d2bf7e57c;

contract('Mock Fund', (accounts) => {
  let fund;
  const investorA = accounts[1];
  const investorB = accounts[2];

  before('Mock Fund Test', async () => {
    fund = await FundInstance.deployed();
  });

  it("Fund shall be able to buy and sell tokens", async () => log.catch(async () => {

    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorA });
    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorB });

    assert.equal((await fund.totalSupply()).toNumber(), web3.toWei(2, 'ether'));

    // fund.buyTokens('', [TOKEN1, TOKEN2], [web3.toWei(1, 'ether'), web3.toWei(1, 'ether')], [1, 1]);
    // const tokens = await fund.getTokens();
    // tokens[1] = tokens[1].map((amount) => amount.toNumber());

    // TODO assert when exchange provider

    // fund.sellTokens('', [TOKEN1, TOKEN2], [web3.toWei(1, 'ether'), web3.toWei(1, 'ether')], [1, 1]);
    // const tokensAfter = await fund.getTokens();
    // tokensAfter[1] = tokensAfter[1].map((amount) => amount.toNumber());

    // TODO assert when exchange provider
  }));


});
