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

contract("Fund", accounts => {
  let fund;
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
  // ----------------------------- REQUIRED FOR CREATION ----------------------
  it("Create a fund", async () => {
    fund = await Fund.new(
      fundData.name,
      fundData.symbol,
      fundData.description,
      fundData.category,
      fundData.decimals,
      { gas: 8e6 } // At the moment require 5.7M
    );
    assert.equal((await fund.status()).toNumber(), 0); // new

    await fund.initialize(componentList.address, fundData.initialManagementFee, fundData.withdrawInterval, {
      value: web3.toWei(fundData.ethDeposit, "ether")
    });
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], fund.address);
    assert.equal((await fund.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));
    assert.equal((await fund.accumulatedFee()).toNumber(), web3.toWei(0.5, "ether"));
  });

  // --------------------------------------------------------------------------
  // ----------------------------- CONFIG TEST  -------------------------------

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await fund.initialize(componentList.address, fundData.initialManagementFee, fundData.withdrawInterval, {
        value: web3.toWei(fundData.ethDeposit, "ether")
      });
    }, "Shall revert");
  });

  it("Update component shall approve MOT ", async () => {
    // Set new market place
    const newRisk = await RiskControl.new();
    await newRisk.setMotAddress(mockMOT.address);

    await componentList.setComponent(await fund.RISK(), newRisk.address);
    await fund.updateComponent(await fund.RISK());
    assert.equal(await fund.getComponentByName(await fund.RISK()), newRisk.address);

    // Check we allowance
    const allowance = await mockMOT.allowance(fund.address, newRisk.address);
    assert.isAbove(allowance, 10 ** 32, 0, "MOT is approved for new component");
  });

  it("Fund shall be able to deploy", async () => {
    assert.equal(await fund.name(), fundData.name);
    assert.equal(await fund.description(), fundData.description);
    assert.equal(await fund.symbol(), fundData.symbol);
    assert.equal(await fund.category(), fundData.category);
    assert.equal(await fund.version(), "1.0");
    assert.equal((await fund.fundType()).toNumber(), DerivativeType.Fund);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- BASIC INVESTMENT ---------------------------

  it("Fund shall allow investment", async () => {
    let tx;
    // With 0 supply price is 1 eth
    assert.equal((await fund.totalSupply()).toNumber(), 0, "Starting supply is 0");
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    tx = await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    assert.ok(calc.getEvent(tx, "Transfer"));
    tx = await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });
    assert.ok(calc.getEvent(tx, "Transfer"));

    // Mapped investor
    const activeInvestors = await fund.getActiveInvestors();
    assert.equal(activeInvestors[0], investorA, "Investor A is active");
    assert.equal(activeInvestors[1], investorB, "Investor B is active");

    assert.equal((await fund.totalSupply()).toNumber(), web3.toWei(2, "ether"), "Supply is updated");
    // Price is the same, as no Token value has changed
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1));
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1));
  });

  it("Shall be able to request and withdraw", async () => {
    let tx;
    await fund.setMaxSteps(DerivativeProviders.WITHDRAW, 1); // For testing

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1), "A has invested");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1), "B has invested");

    // Request
    tx = await fund.requestWithdraw(toTokenWei(1), { from: investorA });
    tx = await fund.requestWithdraw(toTokenWei(1), { from: investorB });

    // Withdraw max transfers is set to 1
    tx = await fund.withdraw();
    assert.ok(calc.getEvent(tx, "Transfer"));

    assert.equal((await fund.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1), " B has no withdrawn");
    assert.equal(await fund.activeInvestors(0), investorB, "Investor B is still active");

    // Cant request while withdrawing
    await calc.assertReverts(
      async () => await fund.requestWithdraw(toTokenWei(1), { from: investorA }),
      "Cant request"
    );

    // Second withdraw succeeds
    tx = await fund.withdraw();
    assert.ok(calc.getEvent(tx, "Transfer"));

    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");
    assert.equal((await fund.getActiveInvestors()).length, 0, "No more active investors");
    await fund.setMaxSteps(DerivativeProviders.WITHDRAW, fundData.maxTransfers); // Restore
  });

  // --------------------------------------------------------------------------
  // ----------------------------- WHITELIST INVESTMENT -----------------------
  // Will enable whitelist for investment and maintenance

  it("Shall be able to invest with whitelist enabled", async () => {
    let tx;
    // Invest Not allowed
    await fund.enableWhitelist(WhitelistType.Investment, true);
    await calc.assertReverts(
      async () => await fund.invest({ value: web3.toWei(0.2, "ether"), from: investorA }),
      "Is not allowed to invest"
    );
    // invest allowed
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });

    // Request always allowed
    await fund.requestWithdraw(toTokenWei(1), { from: investorA });
    await fund.requestWithdraw(toTokenWei(1), { from: investorB });

    tx = await fund.withdraw();

    assert.equal((await fund.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, " B has withdrawn");

    // Reset permissions and disable, so anyone could invest again
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    await fund.enableWhitelist(WhitelistType.Investment, false);
  });

  // In this scenario, there are not request, but is enought to check the modifier
  it("Shall be able to execute withdraw while whitelisted", async () => {
    const bot = accounts[4];
    let tx;

    // Only owner is allowed
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw (only owner)");

    // Withdraw allowed
    await fund.enableWhitelist(WhitelistType.Maintenance, true);

    // // Not whitelisted
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw (only owner)");

    await fund.setAllowed([bot], WhitelistType.Maintenance, true);
    tx = await fund.withdraw({ from: bot });

    // Permissions removed
    await fund.setAllowed([bot], WhitelistType.Maintenance, false);
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw");

    //Reset
    await fund.enableWhitelist(WhitelistType.Maintenance, false);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- TIMER INVESTMENT ----------------------------
  // Will enable the timer

  it("Shall be able to withdraw only after frequency", async () => {
    let tx;
    const interval = 5; //5 seconds frequency
    await fund.setMaxSteps(DerivativeProviders.WITHDRAW, 1); // For testing
    await fund.setMultipleTimeIntervals([await fund.WITHDRAW()], [interval]); // For testing

    // // The lock shall not affect the multy step
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });

    await fund.requestWithdraw(toTokenWei(1), { from: investorA });
    await fund.requestWithdraw(toTokenWei(1), { from: investorB });

    await fund.withdraw();
    assert.notEqual((await fund.balanceOf(investorB)).toNumber(), 0, " B hasn't withdraw yet, step 1/2");
    await fund.withdraw(); // Lock is active, but multistep also
    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, " B has withdraw, withdraw complete");

    await calc.assertReverts(async () => await fund.withdraw(), "Lock avoids the withdraw"); // Lock is active, so we cant withdraw
    // Reset data, so will be updated in next chek
    await fund.setMultipleTimeIntervals([await fund.WITHDRAW()], [0]); // Will be updated in the next withdraw
    await fund.setMaxSteps(DerivativeProviders.WITHDRAW, fundData.maxTransfers);

    await calc.waitSeconds(interval);
    // Lock is over, we can witdraw again
    tx = await fund.withdraw(); // This withdraw has the previus time lock , but will set a new one with 0
    assert.ok(tx);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- MANAGEMENT FEE  ----------------------------
  // Will enable managment fee

  it("Manager shall be able to collect fee from investment and withdraw it", async () => {
    const motRatio = await mockKyber.getExpectedRate(ethToken, mockMOT.address, web3.toWei(1, "ether"));

    // Set fee
    const denominator = (await percentageFee.DENOMINATOR()).toNumber();
    await fund.setManagementFee(fundData.managmentFee * denominator);

    // Invest two times (two different logics for first time and others)
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });

    const expectedFee = 0.5 + 0.2 - 0.01; // Base Fee + Fee from investments - commision of withdraw
    let fee = (await fund.accumulatedFee()).toNumber();
    assert(await calc.inRange(fee, web3.toWei(expectedFee, "ether"), web3.toWei(0.1, "ether")), "Owner got fee");

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");

    // Withdraw
    const withdrawETHAmount = web3.toWei(0.2, "ether");
    const ownerBalanceInital = await calc.ethBalance(accounts[0]);
    const MOTBefore = await mockMOT.balanceOf(accounts[0]);

    await fund.withdrawFee(withdrawETHAmount);

    assert(
      await calc.inRange(fee, web3.toWei(expectedFee - 0.2, "ether"), web3.toWei(0.01, "ether")),
      "Owner pending fee"
    );

    const ownerBalanceAfter = await calc.ethBalance(accounts[0]);
    const MOTAfter = await mockMOT.balanceOf(accounts[0]);

    assert(ownerBalanceAfter < ownerBalanceInital, "Owner dont receive ether as fee"); // Pay gas, just reduced
    const expectedAmountMOT = motRatio[0]
      .mul(withdrawETHAmount)
      .div(10 ** 18)
      .toString();
    assert.equal(expectedAmountMOT, MOTAfter.sub(MOTBefore).toString(), "Owner recieve MOT as fee");
    await fund.setManagementFee(0); // Reset
  });

  // --------------------------------------------------------------------------
  // ----------------------------- BUY/SELL TOKENS -----------------------------
  // Fee is enabled in this section,  also step provider

  it("Buy tokens fails if ether required is not enough", async () => {
    const balance = (await fund.getETHBalance()).toNumber();
    const denominator = (await percentageFee.DENOMINATOR()).toNumber();

    await fund.setManagementFee(fundData.managmentFee * denominator);

    assert.equal(balance, web3.toWei(1.8, "ether"), "This test must start with 1.8 eth");
    const amounts = [web3.toWei(1, "ether"), web3.toWei(1, "ether")];

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );

    await calc.assertReverts(
      async () => await fund.buyTokens(0x0, tokens, amounts, rates.map(rate => rate[0])),
      "reverte if fund balance is not enough"
    );
  });

  it("Shall be able to buy  tokens", async () => {
    // From the preivus test we got 1.8 ETH
    const initialBalance = (await fund.getETHBalance()).toNumber();
    assert.equal(initialBalance, web3.toWei(1.8, "ether"), "This test must start with 1.8 eth");

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];

    let tx;
    tx = await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));

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
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0.8, "ether"), "ETH balance reduced");
  });

  it("Shall be able to sell tokens", async () => {
    let tx;
    // From the preivus test we got 1.8 ETH
    const initialBalance = (await fund.getETHBalance()).toNumber();

    assert.equal(initialBalance, web3.toWei(0.8, "ether"), "This test must start with 1.8 eth");
    let fundTokensAndBalance = await fund.getTokens();
    const balances = fundTokensAndBalance.map(tokenBalance => tokenBalance[1]);
    const sellRates = await Promise.all(
      tokens.map(async (token, index) => await mockKyber.getExpectedRate(token, ethToken, balances[index]))
    );
    // We sell all
    tx = await fund.sellTokens("", fundTokensAndBalance[0], fundTokensAndBalance[1], sellRates.map(rate => rate[0]));

    fundTokensAndBalance = await fund.getTokens();

    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance.toNumber(), 0, "Fund get ERC20 correct balance");
      // Check the fund data is updated correctly
      assert.equal(fundTokensAndBalance[0][i], tokens[i], "Token exist in fund");
      assert.equal(fundTokensAndBalance[1][i].toNumber(), 0, "Balance is correct in the fund");
    }

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant after buy tokens");
    // ETH balance is reduced
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, "ether"), "ETH balance reduced");
  });

  it("Shall be able to sell tokens (by step) to get enough eth for withdraw", async () => {
    await fund.setMaxSteps(DerivativeProviders.GETETH, 1); // For testing

    // From the preivus test we got 1.8 ETH, and investor got 1.8 Token
    const initialBalance = (await fund.getETHBalance()).toNumber();
    assert.equal(initialBalance, web3.toWei(1.8, "ether"), "This test must start with 1.8 eth");
    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");
    const investorABefore = await calc.ethBalance(investorA);

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.9, "ether"), web3.toWei(0.9, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));

    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance.toNumber(), 0.9 * rates[i][0], " Fund get ERC20 correct balance");
    }

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0, "ether"), "We sold all into tokens");
    const tokensAmount = await fund.tokensWithAmount();
    // Request
    await fund.requestWithdraw(toTokenWei(1.8), { from: investorA });
    // GET ETH steps is 1, need 2 times to sell all 2 tokens, and in the second will withdraw
    tx = await fund.withdraw();
    // getTokens will return amounts, but they are not updated til the steps are finished.
    // So that we check directly the balance of erc20
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0, "First step sell 1st token");
    assert.isAbove((await token1_erc20.balanceOf(fund.address)).toNumber(), 0, "First step dont sell 2nd token");
    // Second time complete sell tokens and withdraw at once
    tx = await fund.withdraw();
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0, "Second step sell 2nd token");

    // Investor has recover all his eth  tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(0), "Investor redeemed all the funds");
    assert(await calc.inRange(investorABefore + 1.8, investorAAfter, 0.01), "Investor A received ether");

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant after buy tokens");
    await fund.setMaxSteps(DerivativeProviders.GETETH, 4); // Reset
    await fund.setManagementFee(0);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- CLOSE A TOKEN ------------------------------
  // Uses managment fee and step provider, whitelist

  it("Shall be able to close (by step) a fund", async () => {
    const bot = investorA;
    await fund.setMaxSteps(DerivativeProviders.GETETH, 1); // For testing
    const denominator = (await percentageFee.DENOMINATOR()).toNumber();
    await fund.setManagementFee(fundData.managmentFee * denominator); // Make sure the fee is as per requirements

    await fund.invest({ value: web3.toWei(2, "ether"), from: investorC });
    const initialBalance = (await fund.getETHBalance()).toNumber();
    assert.equal((await fund.balanceOf(investorC)).toNumber(), toTokenWei(1.8), "C has invested with fee");

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.9, "ether"), web3.toWei(0.9, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    // ETH balance is reduced
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0, "ether"), "ETH balance reduced");

    await calc.assertReverts(async () => await fund.sellAllTokensOnClosedFund(), "Fund is not closed");

    await fund.close(); // Just set to close but not sell

    await fund.sellAllTokensOnClosedFund(); // Owner can sell tokens after close
    // getTokens will return amounts, but they are not updated til the steps are finished.
    // So that we check directly the balance of erc20
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0, "First step sell 1st token");
    assert.isAbove((await token1_erc20.balanceOf(fund.address)).toNumber(), 0, "First step dont sell 2nd token");

    // Check whitelist for bot to sell tokens after close
    await calc.assertReverts(async () => await fund.sellAllTokensOnClosedFund({ from: bot }), "Bot is not whitelisted");
    // Whitelist bot
    await fund.enableWhitelist(WhitelistType.Maintenance, true);
    await fund.setAllowed([bot], WhitelistType.Maintenance, true);

    // Second time complete sell tokens and withdraw at once
    await fund.sellAllTokensOnClosedFund({ from: bot });
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 0, "Second step sell 2nd token");

    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");

    let fundTokensAndBalance = await fund.getTokens();
    assert.equal(fundTokensAndBalance[1][0].toNumber(), 0, "token amount == 0");
    assert.equal(fundTokensAndBalance[1][1].toNumber(), 0, "token amount == 0");

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, "ether"), "ETH balance returned");
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Cant change to active ");
    // reset
    await fund.setMaxSteps(DerivativeProviders.GETETH, 4);
    await fund.enableWhitelist(WhitelistType.Maintenance, false);
    await fund.setAllowed([bot], WhitelistType.Maintenance, false);
  });

  it("Investor cant invest but can withdraw after close", async () => {
    assert.equal((await fund.balanceOf(investorC)).toNumber(), toTokenWei(1.8), "C starting balance");

    // Investor cant invest can withdraw
    await calc.assertReverts(
      async () => await fund.invest({ value: web3.toWei(1, "ether"), from: investorA }),
      "Cant invest after close"
    );
    // Request
    await fund.requestWithdraw(toTokenWei(1.8), { from: investorC });
    // no need to call withdraw anymore after the fund is closed.
    // await fund.withdraw();
    assert.equal((await fund.balanceOf(investorC)).toNumber(), 0, " A has withdrawn");
  });

  // --------------------------------------------------------------------------
  // ----------------------------- FUND IS CLOSE ------------------------------
  // Only add more test cases afte the fund is close. Fund cant reopen
});
