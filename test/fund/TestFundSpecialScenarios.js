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

contract("Fund", accounts => {

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
    assert.equal((await fund.tokensBroken(0)), tokens[0], 'Tokens brokens contains token A');
    //withdraw
    //token0 is broken , token1 is not.
    await fund.requestWithdraw(web3.toWei(1, "ether"), { from: investorA });
    const investorBeforeBalance = await calc.ethBalance(investorA);
    await fund.withdraw();
    const investorAfterBalance = await calc.ethBalance(investorA);
    console.log(investorAfterBalance, investorBeforeBalance)
    assert(await calc.inRange(investorAfterBalance, investorBeforeBalance, 1.001), 'Investor A receives no ETH');
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 0, "1st token");
    assert.equal((await token1_erc20.balanceOf(fund.address)).toNumber(), 500000000000000000000, "2st token");

    
    // 2 Users Invest
    // Buy tokens successfully
    // 2 Users request withdraw
    // Set one token broken but not the other (or sell 1 by 1 making 1 step to be broken)
    // Verify return values are correct (part token broken part ETH (for the one is not broken))

  });

  it("Token with balance gets broken in second buy action", async () => {
    const fund = await createNewFund(componentList);
    assert.equal((await fund.status()).toNumber(), 1); // Active

    const investAmount = web3.toWei(2, "ether");
    assert.equal((await fund.status()).toNumber(), 1); // Active
    await fund.invest({ value: investAmount, from: investorA });
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const amounts = [web3.toWei(0.5, "ether"), web3.toWei(0.5, "ether")];
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0])); //buy token normally
    
    assert.equal((await token0_erc20.balanceOf(fund.address)).toNumber(), 500000000000000000000, "1st token");


    await mockKyber.toggleSimulatePriceZero(true);
    await fund.buyTokens("", tokens, amounts, rates.map(rate => rate[0]));
    assert.equal((await fund.tokensBroken(0)), tokens[0], 'Tokens brokens contains token A');
    assert.equal((await fund.tokensBroken(1)), tokens[1], 'Tokens brokens contains token B');
    await fund.requestWithdraw(investAmount, { from: investorA });
    const investorBeforeBalance = await calc.ethBalance(investorA);
    await fund.withdraw();
    const investorAfterBalance = await calc.ethBalance(investorA);
    assert(await calc.inRange(investorAfterBalance, investorBeforeBalance, 1.001), 'Investor A receives no ETH');


    const investorAToken0 = (await token0_erc20.balanceOf(investorA)).toNumber();
    const investorAToken1 = (await token1_erc20.balanceOf(investorA)).toNumber();
    //from the first test we get 0.5eth of token 
    assert.equal(investorAToken0, 500000000000000000000*2, 'Token 0 amount broken withdrawed');
    assert.equal(investorAToken1, 500000000000000000000, 'Token 1 amount broken withdrawed');
    await calc.assertInvalidOpCode(async () => await fund.tokensBroken(0), "Array is empty");
    // Buy tokens successfully
    // Buy same tokens with issue
    // token broken list update
    // withdraw token broken accordingly
  });
});
