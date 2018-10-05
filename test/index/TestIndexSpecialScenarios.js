const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  WhitelistType,
} = require("../utils/constants");

const OlympusIndex = artifacts.require("OlympusIndex");
const Rebalance = artifacts.require("RebalanceProvider");
const RiskControl = artifacts.require("RiskControl");
const StepProvider = artifacts.require("StepProvider");
const Marketplace = artifacts.require("Marketplace");
const Whitelist = artifacts.require("WhitelistProvider");
const Withdraw = artifacts.require("AsyncWithdraw");
const Locker = artifacts.require("Locker");
const MockToken = artifacts.require("MockToken");
const ComponentList = artifacts.require("ComponentList");

const PercentageFee = artifacts.require("PercentageFee");
const Reimbursable = artifacts.require("Reimbursable");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

const indexData = {
  name: "OlympusIndex",
  symbol: "OlympusIndex",
  description: "Sample of real index",
  category: "Index",
  decimals: 18,
  managmentFee: 0.1,
  initialManagementFee: 0,
  ethDeposit: 0.5, // ETH
  weights: [50, 50],
  tokensLenght: 2,
  maxTransfers: 10,
  rebalanceDelta: 30
};
const toTokenWei = amount => {
  return amount * 10 ** indexData.decimals;
};

const expectedTokenAmount = (balance, rates, tokenIndex) => {
  // Balance ETH * (weight)%  * tokenRate / ETH  ==> Expected tokenAmount
  return (balance * (indexData.weights[tokenIndex] / 100) * rates[0][tokenIndex].toNumber()) / 10 ** 18;
};

const getTokensAndAmounts = async (index) => {
  const tokensWeights = await index.getTokens();
  const amounts = await Promise.all(tokensWeights[0].map(async (token) => {
    let erc20 = await ERC20.at(token);
    return erc20.balanceOf(index.address);
  }));
  return [tokensWeights[0], amounts];
}


const createNewIndex = async (componentList, tokens) => {
  const index = await OlympusIndex.new(
    indexData.name,
    indexData.symbol,
    indexData.description,
    indexData.category,
    indexData.decimals,
    tokens.slice(0, indexData.tokensLenght),
    indexData.weights,
    { gas: 8e6 } // At the moment require 6.7M
  );

  await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
    value: web3.toWei(indexData.ethDeposit, "ether")
  });
  return index;
}

contract("Olympus Index Special Scenarios", accounts => {
  let market;
  let mockKyber;
  let mockMOT;
  let exchange;
  let asyncWithdraw;
  let locker;
  let riskControl;
  let percentageFee;
  let rebalance;
  let whitelist;
  let reimbursable;
  let tokens;
  let componentList;
  let stepProvider;

  const investorA = accounts[1];
  const investorB = accounts[2];
  const investorC = accounts[3];


  before("Create Index", async () => {
    mockKyber = await MockKyberNetwork.deployed();
    tokens = (await mockKyber.supportedTokens()).slice(0, 2);

    market = await Marketplace.deployed();
    mockMOT = await MockToken.deployed();
    exchange = await ExchangeProvider.deployed();
    asyncWithdraw = await Withdraw.deployed();
    locker = await Locker.deployed();
    riskControl = await RiskControl.deployed();
    percentageFee = await PercentageFee.deployed();
    rebalance = await Rebalance.deployed();
    whitelist = await Whitelist.deployed();
    reimbursable = await Reimbursable.deployed();
    componentList = await ComponentList.deployed();
    stepProvider = await StepProvider.deployed();

    await exchange.setMotAddress(mockMOT.address);
    await asyncWithdraw.setMotAddress(mockMOT.address);
    await riskControl.setMotAddress(mockMOT.address);
    await percentageFee.setMotAddress(mockMOT.address);
    await rebalance.setMotAddress(mockMOT.address);
    await whitelist.setMotAddress(mockMOT.address);
    await reimbursable.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.EXCHANGE, exchange.address);
    componentList.setComponent(DerivativeProviders.WITHDRAW, asyncWithdraw.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.RISK, riskControl.address);
    componentList.setComponent(DerivativeProviders.FEE, percentageFee.address);
    componentList.setComponent(DerivativeProviders.WHITELIST, whitelist.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);
    componentList.setComponent(DerivativeProviders.REBALANCE, rebalance.address);
    componentList.setComponent(DerivativeProviders.STEP, stepProvider.address);
  });

  it("Bot withdraw selling tokens", async () => {

    const index = await createNewIndex(componentList, tokens);
    assert.equal((await index.status()).toNumber(), 1); // Active

    let tx;
    const bot = investorB; // B will do rol of bot here
    // A invest and request withdraw
    tx = await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    assert.ok(tx);

    tx = await index.requestWithdraw(toTokenWei(1), { from: investorA });
    assert.ok(tx);

    // Owner buy tokens and enable bot to withdraw
    tx = await index.buyTokens();
    assert.ok(tx);

    tx = await index.enableWhitelist(WhitelistType.Maintenance, true);
    assert.ok(tx);

    tx = await index.setAllowed([bot], WhitelistType.Maintenance, true);
    assert.ok(tx);

    // Bot withdraws
    tx = await index.withdraw({ from: bot });

    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, ' A has withdraw');
    assert.equal((await index.getAssetsValue()).toNumber(), 0, 'All tokens are sold');


  });
  // --------------------------------------------------------------------------
  // ----------------------------- WITHDRAW -------------
  it("Buy tokens and get price with underlaying tokens broken", async () => {


    const index = await createNewIndex(componentList, tokens);
    // Invest
    const investAmount = web3.toWei(1, "ether");
    await index.invest({ value: investAmount, from: investorA });
    // Make all the tokens
    await mockKyber.toggleSimulatePriceZero(true);

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, 'ether'), ' Price is constant because nothing was bought');
    assert.equal((await index.getAssetsValue()).toNumber(), 0, ' assets value is  0');

    await calc.assertReverts(
      async () => await index.buyTokens(),
      'Tokens are broken buy reverts'
    );

    price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, 'ether'), ' Price is STILL constant because nothing was bought');
    assert.equal((await index.getAssetsValue()).toNumber(), 0, ' assets value is  STILL 0');

    // Reset
    await mockKyber.toggleSimulatePriceZero(false);

  })

  // --------------------------------------------------------------------------
  // ----------------------------- WITHDRAW -------------

  it("Withdraw doesn't take more ETH than corresponding for balance", async () => {
    // The key of this test is that we get lest ETH than we expect on selling tokens
    await mockKyber.setSlippageMockRate(99);
    ///


    const index = await createNewIndex(componentList, tokens);
    // Invest
    const investAmount = web3.toWei(1, "ether");
    await index.invest({ value: investAmount, from: investorA });
    // Buy token
    await index.buyTokens();
    // Request withdraw 75 %
    await index.requestWithdraw(investAmount * 0.75, { from: investorA });
    // Withdraw
    await index.withdraw();
    // We expect sell part of the tokens, return ETH from (getETHBalance + token sold)
    // Keep
    const ethBalance = (await web3.eth.getBalance(index.address)).toNumber();
    const accFee = (await index.accumulatedFee()).toNumber();
    const assetsValue = (await index.getAssetsValue()).toNumber();
    const indexPrice = (await index.getPrice()).toNumber();
    const indexInvestETHBalance = (await index.getETHBalance()).toNumber();


    assert.equal(indexInvestETHBalance, 0, ' All withdraw is sold');
    assert.isAbove(assetsValue, 0, ' Assets Value has value');
    assert.isAbove(indexPrice, web3.toWei(0.95, "ether"), 'Price reduce because slippage rate a little');
    assert.equal(ethBalance, accFee, ' Eth Balance is the same of acc Fee (all ETH returned)');
    // Reset
    await mockKyber.setSlippageMockRate(100);

  })


});
