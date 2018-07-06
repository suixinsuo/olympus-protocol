const log = require("../utils/log");
const calc = require("../utils/calc");

const OlympusIndex = artifacts.require("OlympusIndex");
const Rebalance = artifacts.require("RebalanceProvider");
const RiskControl = artifacts.require("RiskControl");
const Marketplace = artifacts.require("Marketplace");
const Whitelist = artifacts.require("WhitelistProvider");
const Withdraw = artifacts.require("AsyncWithdraw");
const MockToken = artifacts.require("MockToken");

const PercentageFee = artifacts.require("PercentageFee");
const Reimbursable = artifacts.require("Reimbursable");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

const ethToken = "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const DerivativeStatus = { New: 0, Active: 1, Paused: 2, Closed: 3 };
const DerivativeType = { Index: 0, index: 1 };
const WhitelistType = { Investment: 0, Maintenance: 1 };

const indexData = {
  name: "OlympusIndex",
  symbol: "OlympusIndex",
  description: "Sample of real index",
  category: "Index",
  decimals: 18,
  managmentFee: 0.1,
  ethDeposit: 0.5, // ETH
  weights: [50, 50],
  tokensLenght: 2
};
const toTokenWei = amount => {
  return amount * 10 ** indexData.decimals;
};

contract("Olympus Index", accounts => {
  let index;
  let market;
  let mockKyber;
  let mockMOT;
  let exchange;
  let asyncWithdraw;
  let riskControl;
  let percentageFee;
  let rebalance;
  let whitelist;
  let reimbursable;
  let tokens;
  const investorA = accounts[1];
  const investorB = accounts[2];
  const investorC = accounts[3];

  it("Required same tokens as weights on create", async () =>
    calc.assertReverts(
      async () =>
        await OlympusIndex.new(
          indexData.name,
          indexData.symbol,
          indexData.description,
          indexData.category,
          indexData.decimals,
          tokens.slice(0, indexData.tokensLenght),
          []
        ),
      "Shall revert"
    ));

  it("Create a index", async () => {
    market = await Marketplace.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    tokens = await mockKyber.supportedTokens();
    mockMOT = await MockToken.deployed();
    exchange = await ExchangeProvider.deployed();
    asyncWithdraw = await Withdraw.deployed();
    riskControl = await RiskControl.deployed();
    percentageFee = await PercentageFee.deployed();
    rebalance = await Rebalance.deployed();
    whitelist = await Whitelist.deployed();
    reimbursable = await Reimbursable.deployed();

    index = await OlympusIndex.new(
      indexData.name,
      indexData.symbol,
      indexData.description,
      indexData.category,
      indexData.decimals,
      tokens.slice(0, indexData.tokensLenght),
      indexData.weights
    );

    assert.equal((await index.status()).toNumber(), 0); // new

    calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Active), "Must be still new");
    assert.equal((await index.status()).toNumber(), DerivativeStatus.New, "Must be still new");

    await exchange.setMotAddress(mockMOT.address);
    await asyncWithdraw.setMotAddress(mockMOT.address);
    await riskControl.setMotAddress(mockMOT.address);
    await percentageFee.setMotAddress(mockMOT.address);
    await rebalance.setMotAddress(mockMOT.address);
    await whitelist.setMotAddress(mockMOT.address);
    await reimbursable.setMotAddress(mockMOT.address);

    await index.initialize(
      Marketplace.address,
      ExchangeProvider.address,
      Rebalance.address,
      Withdraw.address,
      RiskControl.address,
      Whitelist.address,
      Reimbursable.address,
      PercentageFee.address,
      0,
      { value: web3.toWei(indexData.ethDeposit, "ether") }
    );
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], index.address);
    assert.equal((await index.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));
    assert.equal((await index.accumulatedFee()).toNumber(), web3.toWei(0.5, "ether"));
  });

  it("Cant call initialize twice ", async () => {
    calc.assertReverts(async () => {
      await index.initialize(
        Marketplace.address,
        ExchangeProvider.address,
        Rebalance.address,
        Withdraw.address,
        RiskControl.address,
        Whitelist.address,
        Reimbursable.address,
        PercentageFee.address,
        0,
        { value: web3.toWei(indexData.ethDeposit, "ether") }
      );
    }, "Shall revert");
  });

  it("Can register in the new marketplace ", async () => {
    // Cant register without changing of market provider
    calc.assertReverts(async () => await index.registerInNewMarketplace(), "Shall not register");

    // Set new market place
    const newMarket = await Marketplace.new();
    await index.setComponentExternal(await index.MARKET(), newMarket.address);
    assert.equal(await index.getComponentByName(await index.MARKET()), newMarket.address);

    // Check we have register
    await index.registerInNewMarketplace();
    const myProducts = await newMarket.getOwnProducts();
    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], index.address);
  });

  it("Index shall be able to deploy", async () => {
    assert.equal(await index.name(), indexData.name);
    assert.equal(await index.description(), indexData.description);
    assert.equal(await index.category(), indexData.category);
    assert.equal(await index.symbol(), indexData.symbol);
    assert.equal(await index.version(), "1.0");
    assert.equal((await index.fundType()).toNumber(), DerivativeType.Index);
    assert.equal((await index.totalSupply()).toNumber(), 0);
    const [indexTokens, weights] = await index.getTokens();

    for (let i = 0; i < indexData.tokensLenght; i++) {
      assert.equal(tokens[i], indexTokens[i], "Token is set correctly");
      assert.equal(indexData.weights[i], weights[i].toNumber(), "Weight is set correctly");
    }
  });

  it("Index shall allow investment", async () => {
    // With 0 supply price is 1 eth
    assert.equal((await index.totalSupply()).toNumber(), 0, "Starting supply is 0");
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));

    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await index.invest({ value: web3.toWei(1, "ether"), from: investorB });

    assert.equal((await index.totalSupply()).toNumber(), web3.toWei(2, "ether"), "Supply is updated");
    // Price is the same, as no Token value has changed
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1));
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1));
  });

  it("Shall be able to request and withdraw", async () => {
    let tx;
    await index.setMaxTransfers(1); // For testing

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1), "A has invested");
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1), "B has invested");

    // Request
    await index.requestWithdraw(toTokenWei(1), { from: investorA });
    await index.requestWithdraw(toTokenWei(1), { from: investorB });

    // Withdraw max transfers is set to 1
    tx = await index.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed");

    assert.equal(await index.withdrawInProgress(), true, " Withdraw has not finished");
    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1), " B has no withdrawn");

    // Second withdraw succeeds
    tx = await index.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed 2");

    assert.equal(await index.withdrawInProgress(), false, " Withdraw has finished");
    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");

    await index.setMaxTransfers(10); // Restore
  });

  it("Shall be able to invest and request with whitelist enabled", async () => {
    let tx;
    // Invest Not allowed
    await index.enableWhitelist(WhitelistType.Investment);
    calc.assertReverts(
      async () => await index.invest({ value: web3.toWei(0.2, "ether"), from: investorA }),
      "Is not allowed to invest"
    );

    // invest allowed
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await index.invest({ value: web3.toWei(1, "ether"), from: investorB });

    // Withdraw not allowed
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    calc.assertReverts(
      async () => await index.requestWithdraw(toTokenWei(0.2), { from: investorA }),
      "Is not allowed to request"
    );

    // Request allowed
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await index.requestWithdraw(toTokenWei(1), { from: investorA });
    await index.requestWithdraw(toTokenWei(1), { from: investorB });

    tx = await index.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, " Owner got Reimbursed");

    assert.equal(await index.withdrawInProgress(), false, " Withdraw has finished");
    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, " B has withdrawn");

    // Reset permissions and disable, so anyone could invest again
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    await index.disableWhitelist(WhitelistType.Investment);
  });

  // In this scenario, there are not request, but is enought to check the modifier
  it("Shall be able to execute mainetnance operations while whitelisted", async () => {
    const bot = accounts[4];
    let tx;
    // Only owner is allowed
    calc.assertReverts(async () => await index.withdraw({ form: bot }), "Is not allowed to withdraw (only owner)");
    calc.assertReverts(async () => await index.rebalance({ form: bot }), "Is not allowed to rebalance (only owner)");

    // Withdraw allowed
    await index.enableWhitelist(WhitelistType.Maintenance);

    await index.setAllowed([bot], WhitelistType.Maintenance, true);
    tx = await index.withdraw({ form: bot });
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, "Bot got Reimbursed");

    tx = await index.rebalance({ form: bot });
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, "Bot got Reimbursed");

    // Permissions removed
    await index.setAllowed([bot], WhitelistType.Maintenance, false);
    calc.assertReverts(async () => await index.withdraw({ form: bot }), "Is not allowed to withdraw");
    calc.assertReverts(async () => await index.rebalance({ form: bot }), "Is not allowed to rebalance");

    //Reset
    await index.disableWhitelist(WhitelistType.Maintenance);
  });

  it("Manager shall be able to collect a from investment and withdraw it", async () => {
    // Set fee
    const denominator = (await (await PercentageFee.deployed()).DENOMINATOR()).toNumber();
    await index.setManagementFee(indexData.managmentFee * denominator);
    const managmentFee = (await index.getManagementFee()).toNumber();
    assert.equal(managmentFee, indexData.managmentFee * denominator, "Fee is set correctly");
    // Invest two times (two different logics for first time and others)
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });

    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });

    const expectedFee = 0.5 + 0.2 - 0.01; // Base Fee + Fee from investments - commision of withdraw
    let fee = (await index.accumulatedFee()).toNumber();
    assert(calc.inRange(fee, web3.toWei(expectedFee, "ether"), web3.toWei(0.1, "ether")), "Owner got fee");

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");

    // Withdraw
    const ownerBalanceInital = await calc.ethBalance(accounts[0]);
    await index.withdrawFee(web3.toWei(0.2, "ether"));
    fee = (await index.accumulatedFee()).toNumber();

    assert(calc.inRange(fee, web3.toWei(expectedFee - 0.2, "ether"), web3.toWei(0.1, "ether")), "Owner pending fee");

    const ownerBalanceAfter = await calc.ethBalance(accounts[0]);

    assert.equal(
      calc.roundTo(ownerBalanceInital + 2 * indexData.managmentFee, 2),
      calc.roundTo(ownerBalanceAfter, 2),
      "Owner received ether"
    );
  });

  it("Shall be able to buy tokens with eth", async () => {
    // From the preivus test we got 1.8 ETH
    const initialIndexBalance = (await index.getETHBalance()).toNumber();
    assert.equal(initialIndexBalance, web3.toWei(1.8, "ether"), "Must start with 1.8 eth");

    await index.buyTokens();
    // Check amounts are correct
    const tokensAndAmounts = await index.getTokensAmounts();

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );

    tokensAndAmounts[1].forEach((amount, index) => {
      // ETH * % * rate
      const expectedAmount =
        (initialIndexBalance * (indexData.weights[index] / 100) * rates[0][index].toNumber()) / 10 ** 18;
      assert.equal(amount.toNumber(), expectedAmount, "Got expected amount");
    });
  });

  it("Shall be able to sell tokens to get enough eth for withdraw", async () => {
    // From the preivus test we got 1.8 ETH, and investor got 1.8 Token
    const initialIndexBalance = (await index.getAssetsValue()).toNumber();
    assert.equal(initialIndexBalance, web3.toWei(1.8, "ether"), "Must start with 1.8 eth");
    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");
    const investorABefore = await calc.ethBalance(investorA);

    // Request
    await index.requestWithdraw(toTokenWei(1.8), { from: investorA });
    tx = await index.withdraw();

    // Investor has recover all his eth  tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(0), "Redeemed all");
    assert.equal(calc.roundTo(investorABefore + 1.8, 2), calc.roundTo(investorAAfter, 2), "Investor A received ether");

    // Price is constant
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant");
  });

  it.skip("Shall be able to rebalance", async () => {
    // INVEST
    // BUY TOKENS
    // BUY TOKENS ACCOUNT 0
    // TRANSFER TOKENS FROM ACCOUNT 0 to INDEX
    // EXECUTE REBALANCE
    // CHECK IS WEIGHTS ARE BEEN FOLLOW
    // PRICE WILL CHANGE THAT WILL MODIFY ETH RECIEVED IN LAST TEST
  });

  it("Shall be able to change the status", async () => {
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Status Is active");

    await index.changeStatus(DerivativeStatus.Paused);
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Paused, " Status is paused");

    await index.changeStatus(DerivativeStatus.Active);
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Status Is active");

    calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.New), "Shall not change to New");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Cant change to new");

    calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Closed), "Cant change to close");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Cant change to close");
  });

  it("Shall be able to close a index", async () => {
    await index.invest({ value: web3.toWei(2, "ether"), from: investorC });
    const initialBalance = (await index.getETHBalance()).toNumber();
    assert.equal(initialBalance, web3.toWei(1.8, "ether"), "This test must start with 1.8 eth");
    assert.equal((await index.balanceOf(investorC)).toNumber(), toTokenWei(1.8), "C has invested with fee");

    // TODO REBALANCE

    await index.close();
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");
    // TODO VERIFY TOKENS ARE SOLD
    for (let i = 0; i < indexData.tokensLenght; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(index.address);
      assert.equal(balance.toNumber(), 0, "Tokens are sold");
    }

    assert.equal((await index.getETHBalance()).toNumber(), web3.toWei(1.8, "ether"), "ETH balance returned");
    calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Active), "Shall keep close");
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Shall keep being closed");
  });

  it("Investor cant invest but can withdraw after close", async () => {
    assert.equal((await index.balanceOf(investorC)).toNumber(), toTokenWei(1.8), "C starting balance");

    // Investor cant invest can withdraw
    calc.assertReverts(
      async () => await index.invest({ value: web3.toWei(1, "ether"), from: investorA }),
      "Cant invest after close"
    );
    // Request
    await index.requestWithdraw(toTokenWei(1.8), { from: investorC });
    await index.withdraw();
    assert.equal((await index.balanceOf(investorC)).toNumber(), 0, " A has withdrawn");
  });
});
