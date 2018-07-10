const log = require("../utils/log");
const calc = require("../utils/calc");

const Fund = artifacts.require("OlympusFund");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");
const RiskControl = artifacts.require("../../contracts/components/RiskControl.sol");
const Marketplace = artifacts.require("../../contracts/Marketplace.sol");
const PercentageFee = artifacts.require("../../contracts/components/fee/PercentageFee.sol");
const Reimbursable = artifacts.require("../../contracts/components/fee/Reimbursable.sol");
const MockToken = artifacts.require("MockToken");
const Whitelist = artifacts.require("WhitelistProvider");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

// Constants

const ethToken = "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const DerivativeStatus = { New: 0, Active: 1, Paused: 2, Closed: 3 };
const DerivativeType = { Index: 0, Fund: 1 };
const WhitelistType = { Investment: 0, Maintenance: 1 };

const fundData = {
  name: "OlympusFund",
  symbol: "MOF",
  category: "Tests",
  description: "Sample of real fund",
  decimals: 18,
  managmentFee: 0.1,
  ethDeposit: 0.5 // ETH
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
  const investorA = accounts[1];
  const investorB = accounts[2];
  const investorC = accounts[3];

  it("Create a fund", async () => {
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

    fund = await Fund.new(fundData.name, fundData.symbol, fundData.description, fundData.category, fundData.decimals);
    assert.equal((await fund.status()).toNumber(), 0); // new

    await calc.assertReverts(async () => await fund.changeStatus(DerivativeStatus.Active), "Must be still new");

    await exchange.setMotAddress(mockMOT.address);
    await asyncWithdraw.setMotAddress(mockMOT.address);
    await riskControl.setMotAddress(mockMOT.address);
    await percentageFee.setMotAddress(mockMOT.address);
    await whitelist.setMotAddress(mockMOT.address);
    await reimbursable.setMotAddress(mockMOT.address);

    await fund.initialize(
      Marketplace.address,
      ExchangeProvider.address,
      AsyncWithdraw.address,
      RiskControl.address,
      Whitelist.address,
      Reimbursable.address,
      PercentageFee.address,
      0,
      { value: web3.toWei(fundData.ethDeposit, "ether") }
    );
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], fund.address);
    assert.equal((await fund.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));
    assert.equal((await fund.accumulatedFee()).toNumber(), web3.toWei(0.5, "ether"));
  });

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await fund.initialize(
        Marketplace.address,
        ExchangeProvider.address,
        AsyncWithdraw.address,
        RiskControl.address,
        Whitelist.address,
        Reimbursable.address,
        PercentageFee.address,
        0,
        { value: web3.toWei(fundData.ethDeposit, "ether") }
      );
    }, "Shall revert");
  });

  it("Can change market provider and register in the new marketplace ", async () => {
    // Cant register without changing of market provider
    await calc.assertReverts(async () => await fund.registerInNewMarketplace(), "Shall not register");

    // Set new market place
    const newMarket = await Marketplace.new();
    await fund.setComponentExternal(await fund.MARKET(), newMarket.address);
    assert.equal(await fund.getComponentByName(await fund.MARKET()), newMarket.address);

    // Check we have register
    await fund.registerInNewMarketplace();
    const myProducts = await newMarket.getOwnProducts();
    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], fund.address);
  });

  it("Fund shall be able to deploy", async () => {
    assert.equal(await fund.name(), fundData.name);
    assert.equal(await fund.description(), fundData.description);
    assert.equal(await fund.symbol(), fundData.symbol);
    assert.equal(await fund.category(), fundData.category);
    assert.equal(await fund.version(), "1.0");
    assert.equal((await fund.fundType()).toNumber(), DerivativeType.Fund);
  });

  it("Fund shall allow investment", async () => {
    let tx;
    // With 0 supply price is 1 eth
    assert.equal((await fund.totalSupply()).toNumber(), 0, "Starting supply is 0");
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    tx =  await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Invest uses risk provider");
    tx = await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Invest uses risk provider");
 

    assert.equal((await fund.totalSupply()).toNumber(), web3.toWei(2, "ether"), "Supply is updated");
    // Price is the same, as no Token value has changed
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1));
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1));
  });

  it("Shall be able to request and withdraw", async () => {
    let tx;
    await fund.setMaxTransfers(1); // For testing

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1), "A has invested");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1), "B has invested");

    // Request
    tx = await fund.requestWithdraw(toTokenWei(1), { from: investorA });
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Withdraw uses risk provider");
    tx = await fund.requestWithdraw(toTokenWei(1), { from: investorB });
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Withdraw uses risk provider");


    // Withdraw max transfers is set to 1
    tx = await fund.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed");

    assert.equal(await fund.withdrawInProgress(), true, " Withdraw has not finished");
    assert.equal((await fund.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toTokenWei(1), " B has no withdrawn");

    // Second withdraw succeeds
    tx = await fund.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed 2");

    assert.equal(await fund.withdrawInProgress(), false, " Withdraw has finished");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");

    await fund.setMaxTransfers(10); // Restore
  });

  it("Shall be able to invest and request with whitelist enabled", async () => {
    let tx;
    // Invest Not allowed
    await fund.enableWhitelist(WhitelistType.Investment);
    await calc.assertReverts(
      async () => await fund.invest({ value: web3.toWei(0.2, "ether"), from: investorA }),
      "Is not allowed to invest"
    );
    // invest allowed
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorB });

    // Withdraw not allowed
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    await calc.assertReverts(
      async () => await fund.requestWithdraw(toTokenWei(0.2), { from: investorA }),
      "Is not allowed to request"
    );

    // Request allowed
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await fund.requestWithdraw(toTokenWei(1), { from: investorA });
    await fund.requestWithdraw(toTokenWei(1), { from: investorB });

    tx = await fund.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed");

    assert.equal(await fund.withdrawInProgress(), false, " Withdraw has finished");
    assert.equal((await fund.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, " B has withdrawn");

    // Reset permissions and disable, so anyone could invest again
    await fund.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    await fund.disableWhitelist(WhitelistType.Investment);
  });

  // In this scenario, there are not request, but is enought to check the modifier
  it("Shall be able to execute withdraw while whitelisted", async () => {
    const bot = accounts[4];
    let tx;

    // Only owner is allowed
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw (only owner)");

    // Withdraw allowed
    await fund.enableWhitelist(WhitelistType.Maintenance);

    // // Not whitelisted
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw (only owner)");

    await fund.setAllowed([bot], WhitelistType.Maintenance, true);
    tx = await fund.withdraw({ from: bot });
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, "Bot got Reimbursed");

    // Permissions removed
    await fund.setAllowed([bot], WhitelistType.Maintenance, false);
    await calc.assertReverts(async () => await fund.withdraw({ from: bot }), "Is not allowed to withdraw");

    //Reset
    await fund.disableWhitelist(WhitelistType.Maintenance);
  });

  it("Manager shall be able to collect a from investment and withdraw it", async () => {
    // Set fee
    const denominator = (await (await PercentageFee.deployed()).DENOMINATOR()).toNumber();
    await fund.setManagementFee(fundData.managmentFee * denominator);
    let fee = (await fund.getManagementFee()).toNumber();

    assert.equal(fee, fundData.managmentFee * denominator, "Fee is set correctly");
    // Invest two times (two different logics for first time and others)
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await fund.invest({ value: web3.toWei(1, "ether"), from: investorA });

    const expectedFee = 0.5 + 0.2 - 0.01; // Base Fee + Fee from investments - commision of withdraw
    fee = (await fund.accumulatedFee()).toNumber();
    assert(calc.inRange(fee, web3.toWei(expectedFee, "ether"), web3.toWei(0.1, "ether")), "Owner got fee");

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");

    // Withdraw
    const ownerBalanceInital = await calc.ethBalance(accounts[0]);
    await fund.withdrawFee(web3.toWei(0.2, "ether"));

    assert(calc.inRange(fee, web3.toWei(expectedFee - 0.2, "ether"), web3.toWei(0.1, "ether")), "Owner pending fee");

    const ownerBalanceAfter = await calc.ethBalance(accounts[0]);

    assert.equal(
      calc.roundTo(ownerBalanceInital + 2 * fundData.managmentFee, 2),
      calc.roundTo(ownerBalanceAfter, 2),
      "Owner received ether"
    );
  });

  it("Buy tokens fails if ether required is not enough", async () => {
    const balance = (await fund.getETHBalance()).toNumber();

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
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Invest uses risk provider");

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
    assert.ok(calc.getEvent(tx, "RiskEvent"), "Invest uses risk provider");

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

  it("Shall be able to sell tokens to get enough eth for withdraw", async () => {
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

    // Request
    await fund.requestWithdraw(toTokenWei(1.8), { from: investorA });
    tx = await fund.withdraw();

    // Investor has recover all his eth  tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await fund.balanceOf(investorA)).toNumber(), toTokenWei(0), "Investor redeemed all the funds");
    assert.equal(calc.roundTo(investorABefore + 1.8, 2), calc.roundTo(investorAAfter, 2), "Investor A received ether");

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant after buy tokens");
  });

  it.skip("Shall be able to dispatch a broken token", async () => {});

  it("Shall be able to change the status", async () => {
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, "Status Is active");
    await fund.changeStatus(DerivativeStatus.Paused);
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Paused, " Status is paused");
    await fund.changeStatus(DerivativeStatus.Active);
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, "Status Is active");

    await calc.assertReverts(
      async () => await fund.changeStatus(DerivativeStatus.New),
      "Shall not be able to change to New"
    );
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, " Cant change to new");

    await calc.assertReverts(
      async () => await fund.changeStatus(DerivativeStatus.Closed),
      "Shall not  change to Close"
    );
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, " Cant change to close");
  });

  it("Shall be able to close a fund", async () => {
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

    await fund.close();
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");

    let fundTokensAndBalance = await fund.getTokens();
    assert.equal(fundTokensAndBalance[1][0].toNumber(), 0, "token amount == 0");
    assert.equal(fundTokensAndBalance[1][1].toNumber(), 0, "token amount == 0");

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, "ether"), "ETH balance returned");
    await calc.assertReverts(async () => await fund.changeStatus(DerivativeStatus.Active), "Shall not be  close");
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, " Cant change to active ");
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
    await fund.withdraw();
    assert.equal((await fund.balanceOf(investorC)).toNumber(), 0, " A has withdrawn");
  });
});
