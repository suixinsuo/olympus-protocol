const log = require("../utils/log");
const calc = require("../utils/calc");

const Fund = artifacts.require("MockFund");
const MockToken = artifacts.require("MockToken");
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

const fundData = {
  name: "Mock Fund",
  symbol: "MFT",
  description: "Testing fund",
  decimals: 18
};
const toTokenWei = amount => {
  return amount * 10 ** fundData.decimals;
};

let DerivativeStatus = { New: 0, Active: 1, Paused: 2, Closed: 3 };

contract("Mock Fund", accounts => {
  let fund;
  let mockKyber;
  let tokens;
  let exchange;
  const investorA = accounts[1];
  const investorB = accounts[2];

  before("Mock Fund Test", async () => {
    mockKyber = await MockKyberNetwork.deployed();
    mockMOT = await MockToken.deployed();
    exchange = await ExchangeProvider.deployed();
    await exchange.setMotAddress(mockMOT.address);

    tokens = (await mockKyber.supportedTokens()).slice(0,2);

    fund = await Fund.new(fundData.name, fundData.symbol, fundData.description, exchange.address);
  });

  it("Fund shall be able deploy", async () => {
    assert.equal(await fund.name(), fundData.name);
    assert.equal(await fund.description(), fundData.description);
    assert.equal(await fund.symbol(), fundData.symbol);
  });

  it("Fund shall be able invest and get price", async () => {
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Initial value");

    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });

    assert.equal((await fund.totalSupply()).toNumber(), toTokenWei(2), "Supply is updated");
    // Price is the same, as no Token value has changed
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1));
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1));
  });

  it("Shall be able to buy and sell tokens", async () => {
    // From the preivus test we got 1.8 ETH
    assert.equal(await calc.ethBalance(fund.address), 2, "This test must start with 2 eth");

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(calc.ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];

    await fund.buyTokens(0x0, tokens, amounts, rates.map(rate => rate[0]));
    const fundTokensAndBalance = await fund.getTokens();
    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance, 0.5 * rates[i][0], " Fund get ERC20 correct balance");
      // Check the fund data is updated correctly
      assert.equal(fundTokensAndBalance[0][i], tokens[i], "Token exist in fund");
      assert.equal(fundTokensAndBalance[1][i].toNumber(), 0.5 * rates[i][0], "Balance is correct in th fund");
    }

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant after buy tokens");
    // ETH balance is reduced
    assert.equal(await calc.ethBalance(fund.address), 1, "ETH balance reduced");
  });

  it("Shall be able to sell  tokens", async () => {
    // From the preivus test we got 1.8 ETH
    assert.equal(await calc.ethBalance(fund.address), 1, "This test must start with 2 eth");
    let fundTokensAndBalance = await fund.getTokens();

    const sellRates = await Promise.all(
      tokens.map(
        async (token, index) => await mockKyber.getExpectedRate(token, calc.ethToken, fundTokensAndBalance[1][index])
      )
    );
    // We sell all
    await fund.sellTokens("", fundTokensAndBalance[0], fundTokensAndBalance[1], sellRates.map(rate => rate[0]));

    fundTokensAndBalance = await fund.getTokens();

    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance.toNumber(), 0, " Fund get ERC20 correct balance");
      // Check the fund data is updated correctly
      assert.equal(fundTokensAndBalance[0][i], tokens[i], "Token exist in fund");
      assert.equal(fundTokensAndBalance[1][i].toNumber(), 0, "Balance is correct in the fund");
    }

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant after buy tokens");
    // ETH balance is reduced
    assert.equal(await calc.ethBalance(fund.address), 2, "This test must start with 2 eth");
  });

  it("Shall be able to change the status and close the fund", async () => {
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, "Status Is active");
    await fund.changeStatus(DerivativeStatus.Paused);
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Paused, " Status is paused");
    await fund.pause();
    await calc.assertReverts(
      async () => await fund.close({ from: investorB }),
      "Shall not be able to close"
    );
    await calc.waitSeconds(3);
    await fund.close({ from: investorB });
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");

    try {
      await fund.changeStatus(DerivativeStatus.New);
      assert(false, "Shall not be able to change to New");
    } catch (e) {
      assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Cant change to new");
    }
  });
});
