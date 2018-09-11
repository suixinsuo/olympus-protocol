const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  ethToken,
  DerivativeStatus,
  WhitelistType,
  DerivativeType
} = require("../utils/constants");
const Fund = artifacts.require("OlympusFund");
const AsyncWithdraw = artifacts.require("components/widrwaw/AsyncWithdraw");
const RiskControl = artifacts.require("components/RiskControl");
const Marketplace = artifacts.require("Marketplace");
const PercentageFee = artifacts.require("PercentageFee");
const Reimbursable = artifacts.require("Reimbursable");
const MockToken = artifacts.require("MockToken");
const Whitelist = artifacts.require("WhitelistProvider");
const ComponentList = artifacts.require("ComponentList");
const LockerProvider = artifacts.require("Locker");
const StepProvider = artifacts.require("StepProvider");
const TokenBroken = artifacts.require("TokenBroken");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

const fundData = {
  name: "OlympusFund",
  symbol: "MOF",
  category: "Tests",
  description: "Sample of real fund",
  decimals: 18,
  managmentFee: 0.1,
  initialManagementFee: 0,
  withdrawInterval: 0,
  ethDeposit: 0.5, // ETH
  maxTransfers: 10
};

const toTokenWei = amount => {
  return amount * 10 ** fundData.decimals;
};

const createNewFund = async (componentList) => {
  const fund = await Fund.new(
    fundData.name,
    fundData.symbol,
    fundData.description,
    fundData.category,
    fundData.decimals,
    { gas: 8e6 } // At the moment require 5.7M
  );

  await fund.initialize(componentList.address, fundData.initialManagementFee, fundData.withdrawInterval, {
    value: web3.toWei(fundData.ethDeposit, "ether")
  });
  return fund;
}

contract("Fund Special Scenarios", accounts => {

  let market;
  let mockKyber;
  let tokens;
  let mockMOT;
  let exchange;
  let asyncWithdraw;
  let riskControl;
  let percentageFee;
  let whitelist;
  let reimbursable;
  let componentList;
  let locker;
  let stepProvider;
  let tokenBroken;
  let token0_erc20;
  let token1_erc20;

  const investorA = accounts[1];
  const investorB = accounts[2];
  const investorC = accounts[3];
  before("Set Component list", async () => {
    mockMOT = await MockToken.deployed();
    market = await Marketplace.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    tokens = await mockKyber.supportedTokens();
    exchange = await ExchangeProvider.deployed();
    asyncWithdraw = await AsyncWithdraw.deployed();
    riskControl = await RiskControl.deployed();
    percentageFee = await PercentageFee.deployed();
    whitelist = await Whitelist.deployed();
    reimbursable = await Reimbursable.deployed();
    componentList = await ComponentList.deployed();
    locker = await LockerProvider.deployed();
    stepProvider = await StepProvider.deployed();
    tokenBroken = await TokenBroken.deployed();

    await exchange.setMotAddress(mockMOT.address);
    await asyncWithdraw.setMotAddress(mockMOT.address);
    await riskControl.setMotAddress(mockMOT.address);
    await percentageFee.setMotAddress(mockMOT.address);
    await whitelist.setMotAddress(mockMOT.address);
    await reimbursable.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.EXCHANGE, exchange.address);
    componentList.setComponent(DerivativeProviders.WITHDRAW, asyncWithdraw.address);
    componentList.setComponent(DerivativeProviders.RISK, riskControl.address);
    componentList.setComponent(DerivativeProviders.FEE, percentageFee.address);
    componentList.setComponent(DerivativeProviders.WHITELIST, whitelist.address);
    componentList.setComponent(DerivativeProviders.REIMBURSABLE, reimbursable.address);
    componentList.setComponent(DerivativeProviders.STEP, stepProvider.address);
    componentList.setComponent(DerivativeProviders.LOCKER, locker.address);
    componentList.setComponent(DerivativeProviders.TOKENBROKEN, tokenBroken.address);
    token0_erc20 = await ERC20.at(await tokens[0]);
    token1_erc20 = await ERC20.at(await tokens[1]);
  });

  // --------------------------------------------------------------------------
  // Create a new fund each test, to create independent complex scenarios
  // ----------------------------- SAMPLE TEST  -------------------------------
  it("Create the fund", async () => {
    const fund = await createNewFund(componentList);
    assert.equal((await fund.status()).toNumber(), 1); // Active
  });


  // --------------------------------------------------------------------------
  // ----------------------------- TOKEN BROKEN --------------------------------
  // Once a token is broken, can be buy/sold again, making a block end. Thats why is tested
  // in FundSpecial scenarios

  it("Shall not be able to buy a broken token", async () => {
    const fund = await createNewFund(componentList);
    const investAmount = web3.toWei(1, "ether");
    // Invest 1 ETH
    await fund.invest({ value: investAmount, from: investorA });
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    // I try to buy tokens broken
    await mockKyber.toggleSimulatePriceZero(true);
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    await mockKyber.toggleSimulatePriceZero(false);
    // They are not bought, but not added to brokenToken list
    await calc.assertInvalidOpCode(async () => await fund.tokensToRelease(0), "Array to release keeps empty");
    assert(await fund.isBrokenToken(tokens[0]), "Token A is mark as broken");
    assert(await fund.isBrokenToken(tokens[1]), "Token B is mark as broken");

    assert.equal(await token0_erc20.balanceOf(fund.address), 0, 'Token A not buyed');
    assert.equal(await token1_erc20.balanceOf(fund.address), 0, 'Token B not buyed');
    assert.equal((await fund.getAssetsValue()).toNumber(), 0, "Assets value is 0");
  });


  it("Shall filter buy and sell token brokens", async () => {
    const fund = await createNewFund(componentList);
    const investAmount = web3.toWei(2, "ether"); // We invest 2 eth, 1 will success, 1 will be already broken
    // Invest 1 ETH and success
    await fund.invest({ value: investAmount, from: investorA });
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));

    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][0], "1st token");
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][1], "2st token");

    // I mark tokens as broken
    await mockKyber.toggleSimulatePriceZero(true);
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    await mockKyber.toggleSimulatePriceZero(false);

    // Tokens are mark as broken forever and will be skipped
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][0], "1st token got skiped on buy");
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][1], "2st token got skiped on buy");

    // Prepare to sell
    let fundTokensAndBalance = await fund.getTokens();
    let balancesToSell = fundTokensAndBalance[1].map(tokenBalance => tokenBalance.toNumber());
    const sellRates = await Promise.all(
      tokens.map(async (token, index) => await mockKyber.getExpectedRate(token, ethToken, balancesToSell[index]))
    );

    // We sell all but are broken
    tx = await fund.sellTokens("", fundTokensAndBalance[0], balancesToSell, sellRates.map(rate => rate[0]));
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][0], "1st token got skiped on sell");
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][1], "2st token got skiped on sell");

  });

  it("Shall mark a broken token while selling and withdraw them as token not ETH", async () => {
    const fund = await createNewFund(componentList);
    const investAmount = web3.toWei(1, "ether"); // Eth
    const investedAmount = toTokenWei(1); // Fund Token

    await fund.invest({ value: investAmount, from: investorA });

    // We buy tokens successfully
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    // Prepare to sell
    let fundTokensAndBalance = await fund.getTokens();
    const balancesToSell = fundTokensAndBalance[1].map(tokenBalance => tokenBalance.toNumber());
    const sellRates = await Promise.all(
      tokens.map(async (token, index) => await mockKyber.getExpectedRate(token, ethToken, balancesToSell[index]))
    );
    fundTokensAndBalance = await fund.getTokens();

    // We sell all but are broken
    await mockKyber.toggleSimulatePriceZero(true);

    tx = await fund.sellTokens("", fundTokensAndBalance[0], balancesToSell, sellRates.map(rate => rate[0]));

    // Check the fund is broken
    assert.equal((await fund.tokensToRelease(0)), tokens[0], 'Tokens to release contains token A');
    assert.equal((await fund.tokensToRelease(1)), tokens[1], 'Tokens to release contains token B');
    assert.equal((await fund.getPrice()).toNumber(), 0, "price is 0");
    assert(await fund.isBrokenToken(tokens[0]), "Token A is mark as broken");
    assert(await fund.isBrokenToken(tokens[1]), "Token B is mark as broken");

    // Prepare to withdraw
    fundTokensAndBalance = await fund.getTokens();
    const balances = fundTokensAndBalance.map((_tokenBalance, index) => fundTokensAndBalance[1][index].toNumber());
    const investorBeforeBalance = await calc.ethBalance(investorA);

    // Investor A requests withdraw
    await fund.requestWithdraw(investedAmount, { from: investorA });
    // On withdraw he will get the tokens brokens
    await fund.withdraw();
    const investorAfterBalance = await calc.ethBalance(investorA);

    assert(await calc.inRange(investorAfterBalance, investorBeforeBalance, 0.001), 'Investor A receives no ETH');
    // Investor A withdraws all token
    const investorAToken0 = (await token0_erc20.balanceOf(investorA)).toNumber();
    const investorAToken1 = (await token1_erc20.balanceOf(investorA)).toNumber();
    assert.equal(investorAToken0, balances[0], 'Token 0 amount broken withdrawed');
    assert.equal(investorAToken1, balances[1], 'Token 1 amount broken withdrawed');
    // Broken token withdrawed and removed
    await calc.assertInvalidOpCode(async () => await fund.tokensToRelease(0), "Array is empty");

    // Reset
    await mockKyber.toggleSimulatePriceZero(false);
    token0_erc20.transfer(mockKyber.address, await token0_erc20.balanceOf(investorA), { from: investorA });
    token1_erc20.transfer(mockKyber.address, await token1_erc20.balanceOf(investorA), { from: investorA });

  });

  it("Token broken while sell ETH when withdrawing returns part ETH part token broken", async () => {
    const fund = await createNewFund(componentList);
    const investAmount = web3.toWei(2, "ether");
    assert.equal((await fund.status()).toNumber(), 1); // Active
    await fund.invest({ value: investAmount, from: investorA });
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];

    //buy token0 normally
    await fund.buyTokens("", [tokens[0]], [amounts[0]], [rates.map(rate => rate[0])[0]]);
    //set all broken
    await mockKyber.toggleSimulatePriceZero(true);
    //buy token0 broken
    await fund.buyTokens("", [tokens[0]], [amounts[0]], [rates.map(rate => rate[0])[0]]);
    //set back
    await mockKyber.toggleSimulatePriceZero(false);
    //buy token1 normally
    await fund.buyTokens("", [tokens[1]], [amounts[1]], [rates.map(rate => rate[0])[1]]);
    assert.equal((await fund.tokensToRelease(0)), tokens[0], 'Tokens brokens contains token A');
    //withdraw
    //token0 is broken , token1 is not.
    await fund.requestWithdraw(web3.toWei(1, "ether"), { from: investorA });
    const investorBeforeBalance = await calc.ethBalance(investorA);
    await fund.withdraw();
    const investorAfterBalance = await calc.ethBalance(investorA);
    assert(await calc.inRange(investorAfterBalance, investorBeforeBalance, 1.001), 'Investor A receives no ETH');
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0, "1st token");
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][1], "2st token");

    // Reset
    token0_erc20.transfer(mockKyber.address, await token0_erc20.balanceOf(investorA), { from: investorA });
    // 2 Users Invest
    // Buy tokens successfully
    // 2 Users request withdraw
    // Set one token broken but not the other (or sell 1 by 1 making 1 step to be broken)
    // Verify return values are correct (part token broken part ETH (for the one is not broken))

  });

  it("Token with balance gets broken in second buy action", async () => {
    const fund = await createNewFund(componentList);
    // Invest
    const investAmount = web3.toWei(2, "ether");
    await fund.invest({ value: investAmount, from: investorA });
    // Buy successfull
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0])); //buy token normally

    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0.5 * rates[0][0], "1st token");


    // Buy broken token
    await mockKyber.toggleSimulatePriceZero(true);
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    assert.equal((await fund.tokensToRelease(0)), tokens[0], 'Tokens brokens contains token A');
    assert.equal((await fund.tokensToRelease(1)), tokens[1], 'Tokens brokens contains token B');
    // Withdraw
    const investorBeforeBalance = await calc.ethBalance(investorA);
    await fund.requestWithdraw(investAmount, { from: investorA });
    await fund.withdraw();
    const investorAfterBalance = await calc.ethBalance(investorA);
    // Check returns
    assert(await calc.inRange(investorAfterBalance, investorBeforeBalance, 1.001), 'Investor A receives 1 ETH');

    const investorAToken0 = (await token0_erc20.balanceOf(investorA)).toNumber();
    const investorAToken1 = (await token1_erc20.balanceOf(investorA)).toNumber();
    //from the first test we get 0.5eth of token
    assert.equal(investorAToken0, 0.5 * rates[0][0], 'Token 0 amount broken withdrawed');
    assert.equal(investorAToken1, 0.5 * rates[0][1], 'Token 1 amount broken withdrawed');
    await calc.assertInvalidOpCode(async () => await fund.tokensToRelease(0), "Array is empty");
    // Buy tokens successfully
    // Buy same tokens with issue
    // token broken list update
    // withdraw token broken accordingly
  });

  // --------------------------------------------------------------------------
  // ----------------------------- Accumulated Fee Value correct -------------

  it("Withdraw doesn't take more ETH than corresponding for balance", async () => {
    // The key of this test is that we get lest ETH than we expect on selling tokens
    await mockKyber.setSlippageMockRate(99);
    ///

    const fund = await createNewFund(componentList);
    // Invest
    const investAmount = web3.toWei(1, "ether");
    await fund.invest({ value: investAmount, from: investorA });
    // Buy token
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.4, "ether"), web3.toWei(0.4, "ether")]; // Buy 0.8 of 1 ETH as scenario
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    // Request withdraw 75 %
    await fund.requestWithdraw(investAmount * 0.75, { from: investorA });
    // Withdraw
    await fund.withdraw();
    // We expect sell part of the tokens, return ETH from (getETHBalance + token sold)
    // Keep
    const ethBalance = (await web3.eth.getBalance(fund.address)).toNumber();
    const accFee = (await fund.accumulatedFee()).toNumber();
    const assetsValue = (await fund.getAssetsValue()).toNumber();
    const fundPrice = (await fund.getPrice()).toNumber();
    const fundInvestETHBalance = (await fund.getETHBalance()).toNumber();


    assert.isAbove(fundInvestETHBalance, 0, ' ETH Balance for buy tokens is 0');
    assert.isAbove(assetsValue, 0, ' Assets Value has value');
    assert.isAbove(fundPrice, web3.toWei(0.95, "ether"), ' Assets Value has value');
    assert.equal(ethBalance, accFee, ' Eth Balance is the same of acc Fee (all ETH returned)');
    // Reset
    await mockKyber.setSlippageMockRate(100);

  })
  // --------------------------------------------------------------------------
  // ----------------------------- OTHER TEST --------------------------------
  // Add other integration or road-end test here

});
