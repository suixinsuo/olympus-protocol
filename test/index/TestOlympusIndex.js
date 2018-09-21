const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  ethToken,
  DerivativeStatus,
  WhitelistType,
  DerivativeType
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
  wrongEthDeposit: 0.05,
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

const getTokensAndAmounts = async index => {
  const tokensWeights = await index.getTokens();
  const amounts = await Promise.all(
    tokensWeights[0].map(async token => {
      let erc20 = await ERC20.at(token);
      return erc20.balanceOf(index.address);
    })
  );
  return [tokensWeights[0], amounts];
};

contract("Olympus Index", accounts => {
  let index;
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

  before("Initalize tokens", async () => {
    mockKyber = await MockKyberNetwork.deployed();
    tokens = await mockKyber.supportedTokens();

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

  it("Required same tokens as weights on create", async () =>
    await calc.assertReverts(
      async () =>
        await OlympusIndex.new(
          indexData.name,
          indexData.symbol,
          indexData.description,
          indexData.category,
          indexData.decimals,
          tokens.slice(0, indexData.tokensLenght),
          [],
          { gas: 8e6 } // At the moment require 6.7M
        ),
      "Shall revert"
    ));


  it("Required tokens to be ERC20Extended Standard", async () =>
    await calc.assertReverts(
      async () =>
        await OlympusIndex.new(
          indexData.name,
          indexData.symbol,
          indexData.description,
          indexData.category,
          indexData.decimals,
          [rebalance.address, asyncWithdraw.address], // NOT erc20
          indexData.weights,
          { gas: 8e6 } // At the moment require 6.7M
        ),
      "Shall revert"
    )
  );

  it("Create a index", async () => {
    index = await OlympusIndex.new(
      indexData.name,
      indexData.symbol,
      indexData.description,
      indexData.category,
      indexData.decimals,
      tokens.slice(0, indexData.tokensLenght),
      indexData.weights,
      { gas: 8e6 } // At the moment require 6.7M
    );

    assert.equal((await index.status()).toNumber(), 0); // new

    assert.equal((await index.status()).toNumber(), DerivativeStatus.New, "Must be still new");

    await calc.assertReverts(async () => {
      await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
        value: web3.toWei(indexData.wrongEthDeposit, "ether")
      });
    }, "initial ETH should be equal or more than 0.1 ETH");

    await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
      value: web3.toWei(indexData.ethDeposit, "ether")
    });
    const myProducts = await market.getOwnProducts();

    // Reset the intervals for easy testing
    const intervals = [await index.REBALANCE(), await index.BUYTOKENS(), await index.WITHDRAW()];
    await index.setMultipleTimeIntervals(intervals, [0, 0, 0]);

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], index.address);
    assert.equal((await index.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));
    assert.equal((await index.accumulatedFee()).toNumber(), web3.toWei(0.5, "ether"));
  });

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
        value: web3.toWei(indexData.ethDeposit, "ether")
      });
    }, "Shall revert");
  });

  it("Update component shall approve MOT ", async () => {
    // Set new market place
    const newRisk = await RiskControl.new();
    await newRisk.setMotAddress(mockMOT.address);

    await componentList.setComponent(await index.RISK(), newRisk.address);
    await index.updateComponent(await index.RISK());
    assert.equal(await index.getComponentByName(await index.RISK()), newRisk.address);

    // Check we allowance
    const allowance = await mockMOT.allowance(index.address, newRisk.address);
    assert.isAbove(allowance, 10 ** 32, 0, "MOT is approved for new component");
  });

  it("Can register in the new marketplace ", async () => {
    // Set new market place
    const newMarket = await Marketplace.new();
    await componentList.setComponent(await index.MARKET(), newMarket.address);
    await index.updateComponent(await index.MARKET());
    assert.equal(await index.getComponentByName(await index.MARKET()), newMarket.address);
  });

  it("Index shall be able to deploy", async () => {
    assert.equal(await index.name(), indexData.name);
    assert.equal(await index.description(), indexData.description);
    assert.equal(await index.category(), indexData.category);
    assert.equal(await index.symbol(), indexData.symbol);
    assert.equal((await index.fundType()).toNumber(), DerivativeType.Index);
    assert.equal((await index.totalSupply()).toNumber(), 0);
    const [indexTokens, weights] = await index.getTokens();

    for (let i = 0; i < indexData.tokensLenght; i++) {
      assert.equal(tokens[i], indexTokens[i], "Token is set correctly");
      assert.equal(indexData.weights[i], weights[i].toNumber(), "Weight is set correctly");
    }
  });

  it("Index shall allow investment", async () => {
    let tx;
    // With 0 supply price is 1 eth
    assert.equal((await index.totalSupply()).toNumber(), 0, "Starting supply is 0");
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));

    tx = await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    assert.ok(calc.getEvent(tx, "Transfer"));
    tx = await index.invest({ value: web3.toWei(1, "ether"), from: investorB });
    assert.ok(calc.getEvent(tx, "Transfer"));

    assert.equal((await index.totalSupply()).toNumber(), web3.toWei(2, "ether"), "Supply is updated");
    // Price is the same, as no Token value has changed
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1));
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1));
  });

  it("Rebalance works with no tokens", async () => {
    let tx;
    let rebalanceFinished = false;
    while (rebalanceFinished == false) {
      rebalanceFinished = await index.rebalance.call();
      tx = await index.rebalance();
      assert.ok(tx);
    }

    assert.equal((await index.totalSupply()).toNumber(), web3.toWei(2, "ether"), "Supply is updated");
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));
    const tokenAmounts = await getTokensAndAmounts(index);
    tokenAmounts[1].forEach(amount => assert.equal(amount, 0, "Amount is 0"));
  });

  // it("Can't rebalance so frequently", async () => {
  //   console.log(await index.getProductStatus())
  //   await calc.assertReverts(async () => await index.rebalance(), "Should be reverted");
  //   console.log(await index.getProductStatus())
  //   // disable the lock
  //   await index.setMultipleTimeIntervals([await index.REBALANCE()], [0]);
  // });

  it("Buy Tokens works with no ETH", async () => {
    let tx;

    tx = await index.buyTokens();
    assert.ok(tx);
    const status = await stepProvider.status(index.address, DerivativeProviders.BUYTOKENS);
    const functionStep = await stepProvider.currentFunctionStep(index.address, DerivativeProviders.BUYTOKENS);
    const callStep = await stepProvider.currentCallStep(index.address, DerivativeProviders.BUYTOKENS);
    assert.equal(status.toNumber(), 0, "Buy tokens finish correctly: status");
    assert.equal(callStep.toNumber(), 0, "Buy tokens finish correctly: call step");
    assert.equal(functionStep.toNumber(), 0, "Buy tokens finish correctly: Call function step");
  });

  it("Shall be able to request and withdraw", async () => {
    let tx;
    await index.setMaxSteps(DerivativeProviders.WITHDRAW, 1); // For testing

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1), "A has invested");
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1), "B has invested");

    // Request
    tx = await index.requestWithdraw(toTokenWei(1), { from: investorA });
    tx = await index.requestWithdraw(toTokenWei(1), { from: investorB });

    // Withdraw max transfers is set to 1
    tx = await index.withdraw();
    assert.ok(calc.getEvent(tx, "Transfer"));

    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await index.balanceOf(investorB)).toNumber(), toTokenWei(1), " B has no withdrawn");

    // Second withdraw succeeds
    tx = await index.withdraw();
    assert.ok(calc.getEvent(tx, "Transfer"));

    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");

    await index.setMaxSteps(DerivativeProviders.WITHDRAW, indexData.maxTransfers); // Restore
  });

  it("Shall be able to invest whitelist enabled", async () => {
    let tx;

    // Invest Not allowed
    await index.enableWhitelist(WhitelistType.Investment, true);
    await calc.assertReverts(
      async () => await index.invest({ value: web3.toWei(0.2, "ether"), from: investorA }),
      "Is not allowed to invest"
    );

    // invest allowed
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, true);
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await index.invest({ value: web3.toWei(1, "ether"), from: investorB });

    // Request is always allowed
    await index.requestWithdraw(toTokenWei(1), { from: investorA });
    await index.requestWithdraw(toTokenWei(1), { from: investorB });
    tx = await index.withdraw();

    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");
    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, " B has withdrawn");

    // Reset permissions and disable, so anyone could invest again
    await index.setAllowed([investorA, investorB], WhitelistType.Investment, false);
    await index.enableWhitelist(WhitelistType.Investment, false);
  });

  // In this scenario, there are not request, but is enought to check the modifier
  it("Shall be able to execute mainetnance operations while whitelisted", async () => {
    const bot = accounts[4];
    let tx;
    // Only owner is allowed
    await calc.assertReverts(async () => await index.withdraw({ from: bot }), "Whitdraw (only owner)");
    await calc.assertReverts(async () => await index.rebalance({ from: bot }), "Whitdraw (only owner)");

    // Withdraw allowed
    await index.enableWhitelist(WhitelistType.Maintenance, true);

    // Only owner is allowed
    await calc.assertReverts(async () => await index.withdraw({ from: bot }), "Withdraw (not  whitelisted)");
    await calc.assertReverts(async () => await index.rebalance({ from: bot }), "Withdraw  not whitelisted");

    await index.setAllowed([bot], WhitelistType.Maintenance, true);
    tx = await index.withdraw({ from: bot });

    // tx = await index.rebalance({ from: bot });

    // Permissions removed
    await index.setAllowed([bot], WhitelistType.Maintenance, false);
    await calc.assertReverts(async () => await index.withdraw({ from: bot }), "Is not allowed to withdraw");
    await calc.assertReverts(async () => await index.rebalance({ from: bot }), "Is not allowed to rebalance");

    //Reset
    await index.enableWhitelist(WhitelistType.Maintenance, false);
  });

  it("Shall be able to withdraw only after frequency", async () => {
    
    let tx;
    const interval = 5; //5 seconds frequency
    await index.setMaxSteps(DerivativeProviders.WITHDRAW, 1); // For testing
    await index.setMultipleTimeIntervals([await index.WITHDRAW()], [interval]); // For testing

    // // The lock shall not affect the multy step
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await index.invest({ value: web3.toWei(1, "ether"), from: investorB });

    await index.requestWithdraw(toTokenWei(1), { from: investorA });
    await index.requestWithdraw(toTokenWei(1), { from: investorB });
    await index.withdraw();
    assert.notEqual((await index.balanceOf(investorB)).toNumber(), 0, " B hasn't withdraw yet, step 1/2");
    await index.withdraw(); // Lock is active, but multistep also
    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, " B has withdraw, withdraw complete");

    await calc.assertReverts(async () => await index.withdraw(), "Lock avoids the withdraw"); // Lock is active, so we cant withdraw
    // Reset data, so will be updated in next chek
    await index.setMultipleTimeIntervals([await index.WITHDRAW()], [0]); // Will be updated in the next withdraw
    await index.setMaxSteps(DerivativeProviders.WITHDRAW, indexData.maxTransfers);

    await calc.waitSeconds(interval);
    // Lock is over, we can witdraw again
    tx = await index.withdraw(); // This withdraw has the previus time lock , but will set a new one with 0
    assert.ok(tx);
  });

  it("Manager shall be able to collect fee from investment and withdraw it", async () => {
    const motRatio = await mockKyber.getExpectedRate(ethToken, mockMOT.address, web3.toWei(1, "ether"));
    // Set fee
    const denominator = (await (await PercentageFee.deployed()).DENOMINATOR()).toNumber();
    await index.setManagementFee(indexData.managmentFee * denominator);

    // Invest two times (two different logics for first time and others)
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });

    const expectedFee = 0.5 + 0.2 - 0.01; // Base Fee + Fee from investments - commision of withdraw
    let fee = (await index.accumulatedFee()).toNumber();
    assert(await calc.inRange(fee, web3.toWei(expectedFee, "ether"), web3.toWei(0.1, "ether")), "Owner got fee");

    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");

    // Withdraw
    const withdrawETHAmount = web3.toWei(0.2, "ether");
    const ownerBalanceInital = await calc.ethBalance(accounts[0]);
    const MOTBefore = await mockMOT.balanceOf(accounts[0]);

    await calc.assertReverts(async () => {
      await index.withdrawFee(await index.accumulatedFee()); // try take all, fail.
    }, "withdraw Fee can't take all, it should leave 0.1 ETH in there");

    // take less, success.
    await index.withdrawFee(withdrawETHAmount);

    fee = (await index.accumulatedFee()).toNumber();
    assert(
      await calc.inRange(fee, web3.toWei(expectedFee - 0.2, "ether"), web3.toWei(0.1, "ether")),
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
  });

  it("Shall be able to buy tokens with eth", async () => {
    // From the preivus test we got 1.8 ETH
    const initialIndexBalance = (await index.getETHBalance()).toNumber();
    assert.equal(initialIndexBalance, web3.toWei(1.8, "ether"), "Must start with 1.8 eth");
    await index.setMaxSteps(await index.BUYTOKENS(), 1); // 2 tokens need to calls
    await index.buyTokens();
    const status = await stepProvider.status.call(index.address, await index.BUYTOKENS());
    assert.equal(status.toNumber(), 1, "Buy is in progress");
    await index.buyTokens();

    // Check amounts are correct
    const tokensAndAmounts = await getTokensAndAmounts(index);

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );

    tokensAndAmounts[1].forEach((amount, index) => {
      const expectedAmount = expectedTokenAmount(initialIndexBalance, rates, index);
      assert.equal(amount.toNumber(), expectedAmount, "Got expected amount");
    });
    // Restore
    await index.setMaxSteps(await index.BUYTOKENS(), 3);
  });

  it("Can't buy tokens so frequently", async () => {
    await calc.assertReverts(async () => await index.buyTokens(), "Should be reverted");
    // disable the lock
    await index.setMultipleTimeIntervals([await index.BUYTOKENS()], [0]);
  });

  it("Shall be able to sell tokens to get enough eth for withdraw", async () => {
    let token0_erc20 = await ERC20.at(await index.tokens(0));
    let token1_erc20 = await ERC20.at(await index.tokens(1));
    await index.setMaxSteps(DerivativeProviders.GETETH, 1); // For testing

    // From the preivus test we got 1.8 ETH, and investor got 1.8 Token
    const initialIndexBalance = (await index.getAssetsValue()).toNumber();
    assert.equal(initialIndexBalance, web3.toWei(1.8, "ether"), "Must start with 1.8 eth");
    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(1.8), "A has invested with fee");
    const investorABefore = await calc.ethBalance(investorA);

    // Request
    await index.requestWithdraw(toTokenWei(1.8), { from: investorA });
    tx = await index.withdraw();
    // getTokens will return amounts, but they are not updated til the steps are finished.
    // So that we check directly the balance of erc20
    assert.equal((await token0_erc20.balanceOf(index.address)).toNumber(), 0, "First step sell 1st token");
    assert.isAbove((await token1_erc20.balanceOf(index.address)).toNumber(), 0, "First step dont sell 2nd token");
    // Second time complete sell tokens and withdraw at once
    tx = await index.withdraw();
    assert.equal((await token1_erc20.balanceOf(index.address)).toNumber(), 0, "Second step sell 2nd token");

    // Investor has recover all his eth  tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(0), "Redeemed all");
    assert(await calc.inRange(investorAAfter - investorABefore, 1.8, 0.001), "Investor A received ether");

    // Price is constant
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant");
    await index.setMaxSteps(DerivativeProviders.GETETH, 4); // Reset
  });

  it("Shall be able to rebalance", async () => {
    let tx;
    let tokenAmounts;
    // Invest and get initial data
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    const initialIndexBalance = (await index.getETHBalance()).toNumber();
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const extraAmount = +web3.toWei(1, "ether");
    // Buy tokens and sent to index, forcing increase his total assets value
    tx = await index.buyTokens();
    assert.ok(tx);

    assert.equal((await index.getETHBalance()).toNumber(), 0, "ETH used to buy"); // All ETH has been sald
    const initialAssetsValue = +(await index.getAssetsValue()).toNumber();

    exchange.buyToken(tokens[0], extraAmount, 0, index.address, 0x0, {
      value: extraAmount
    });
    const endTotalAssetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(endTotalAssetsValue, initialAssetsValue + extraAmount, "Increased Assets Value");
    // Execute Rebalance
    // Make sure it has to do multiple calls
    await index.setMaxSteps(DerivativeProviders.REBALANCE, 1);
    let rebalanceFinished = false;
    while (rebalanceFinished == false) {
      rebalanceFinished = await index.rebalance.call();
      tx = await index.rebalance();
      assert.ok(tx);
    }
    // Restore
    await index.setMaxSteps(DerivativeProviders.REBALANCE, 3);

    // Reblacance keep the amounts as per the wieghts
    tokenAmounts = await getTokensAndAmounts(index);
    tokenAmounts[1].forEach((amount, index) => {
      const expectedAmount = expectedTokenAmount(initialIndexBalance + extraAmount, rates, index);
      assert.equal(amount.toNumber(), expectedAmount, "Got expected amount");
    });
    // Price is updated because we force the total assets value increase while not the supply
    const price = (await index.getPrice()).toNumber();
    const supply = (await index.totalSupply()).toNumber();
    const priceInRange = await calc.inRange(
      price,
      ((initialAssetsValue + extraAmount) * 10 ** indexData.decimals) / supply,
      web3.toWei(0.00001, "ether")
    );
    assert.ok(priceInRange, "Price updated");
  });

  it("Shall be able to close (by step) a index", async () => {
    const bot = investorA;

    await index.invest({
      value: web3.toWei(2, "ether"),
      from: investorC
    });
    await index.setMaxSteps(DerivativeProviders.GETETH, 1); // For testing

    let token0_erc20 = await ERC20.at(await index.tokens(0));
    let token1_erc20 = await ERC20.at(await index.tokens(1));

    const price = (await index.getPrice()).toNumber();
    const priceInRange = await calc.inRange(
      (await index.balanceOf(investorC)).toNumber(),
      web3.toWei(toTokenWei(1.8) / price, "ether"),
      web3.toWei(0.001, "ether")
    );
    assert.ok(priceInRange, "C has invested with fee");

    await index.buyTokens();
    // Cant sellOnClosedFund if is not closed
    await calc.assertReverts(async () => await index.sellAllTokensOnClosedFund(), "Index is not closed");

    await index.close(); // Thats only closing, not selling tokens

    await index.sellAllTokensOnClosedFund(); // Owner can sell tokens after close
    // getTokens will return amounts, but they are not updated til the steps are finished.
    // So that we check directly the balance of erc20
    assert.equal((await token0_erc20.balanceOf(index.address)).toNumber(), 0, "First step sell 1st token");
    assert.isAbove((await token1_erc20.balanceOf(index.address)).toNumber(), 0, "First step dont sell 2nd token");

    // Check whitelist for bot to sell tokens after close
    await calc.assertReverts(
      async () =>
        await index.sellAllTokensOnClosedFund({
          from: bot
        }),
      "Bot is not whitelisted"
    );
    // Whitelist bot
    await index.enableWhitelist(WhitelistType.Maintenance, true);
    await index.setAllowed([bot], WhitelistType.Maintenance, true);

    // Second time complete sell tokens and withdraw at once
    await index.sellAllTokensOnClosedFund({
      from: bot
    });

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");
    // TODO VERIFY TOKENS ARE SOLD (refactor with getTokensAndAmounts())
    for (let i = 0; i < indexData.tokensLenght; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(index.address);
      assert.equal(balance.toNumber(), 0, "Tokens are sold");
    }

    assert.equal((await index.getAssetsValue()).toNumber(), 0, "Assets value is 0");
    assert.isAbove((await index.getETHBalance()).toNumber(), 0, "ETH balance returned");
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Shall keep being closed");

    // after closed and tokens are sold, manager can take all money out.
    await index.withdrawFee(await index.accumulatedFee());

    await index.setMaxSteps(DerivativeProviders.GETETH, 4); // For testing
  });

  it("Investor cant invest but can withdraw after close", async () => {
    assert.isAbove((await index.balanceOf(investorC)).toNumber(), 0, "C starting balance");

    // Investor cant invest can withdraw
    await calc.assertReverts(
      async () => await index.invest({ value: web3.toWei(1, "ether"), from: investorA }),
      "Cant invest after close"
    );
    // Request
    await index.requestWithdraw((await index.balanceOf(investorC)).toString(), { from: investorC });
    // no need to call withdraw anymore after the fund is closed.
    // await index.withdraw();

    assert.equal((await index.balanceOf(investorC)).toString(), 0, " C has withdrawn");
  });
});
