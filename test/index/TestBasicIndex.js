const log = require("../utils/log");
const calc = require("../utils/calc");
const {
  DerivativeProviders,
  ethToken,
  DerivativeStatus,
  WhitelistType,
  DerivativeType
} = require("../utils/constants");

const BasicIndex = artifacts.require("OlympusBasicIndex");
const Rebalance = artifacts.require("RebalanceProvider");
const Marketplace = artifacts.require("Marketplace");
const Withdraw = artifacts.require("AsyncWithdraw");
const MockToken = artifacts.require("MockToken");
const ComponentList = artifacts.require("ComponentList");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");

const indexData = {
  name: "BasicIndex",
  symbol: "BasicIndex",
  description: "Sample of real index",
  category: "Index",
  decimals: 18,
  managmentFee: 0.1,
  initialManagementFee: 0,
  weights: [50, 50],
  tokensLenght: 2,
  rebalanceDelta: 30
};
const toTokenWei = amount => {
  return amount * 10 ** indexData.decimals;
};

const expectedTokenAmount = (balance, rates, tokenIndex) => {
  // Balance ETH * (weight)%  * tokenRate / ETH  ==> Expected tokenAmount
  return (balance * (indexData.weights[tokenIndex] / 100) * rates[0][tokenIndex].toNumber()) / 10 ** 18;
};

contract("Basic Index", accounts => {

  let index;
  let market;
  let mockKyber;
  let mockMOT;
  let exchange;
  let asyncWithdraw;
  let rebalance;
  let tokens;
  let componentList;

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
    rebalance = await Rebalance.deployed();
    componentList = await ComponentList.deployed();

    await exchange.setMotAddress(mockMOT.address);
    await asyncWithdraw.setMotAddress(mockMOT.address);
    await rebalance.setMotAddress(mockMOT.address);

    componentList.setComponent(DerivativeProviders.MARKET, market.address);
    componentList.setComponent(DerivativeProviders.EXCHANGE, exchange.address);
    componentList.setComponent(DerivativeProviders.WITHDRAW, asyncWithdraw.address);
    componentList.setComponent(DerivativeProviders.REBALANCE, rebalance.address);
  });

  it("Required same tokens as weights on create", async () =>
    await calc.assertReverts(
      async () =>
        await BasicIndex.new(
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
    index = await BasicIndex.new(
      indexData.name,
      indexData.symbol,
      indexData.description,
      indexData.category,
      indexData.decimals,
      tokens.slice(0, indexData.tokensLenght),
      indexData.weights
    );

    assert.equal((await index.status()).toNumber(), 0); // new

    await calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Active), "Must be still new");
    assert.equal((await index.status()).toNumber(), DerivativeStatus.New, "Must be still new");

    await index.initialize(componentList.address, indexData.rebalanceDelta);
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], index.address);
    assert.equal((await index.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));
  });

  it("Cant call initialize twice ", async () => {
    await calc.assertReverts(async () => {
      await index.initialize(componentList.address, indexData.rebalanceDelta);
    }, "Shall revert");
  });

  it("Update component shall approve MOT ", async () => {
    // Set new market place
    const newWithdraw = await Withdraw.new();
    await newWithdraw.setMotAddress(mockMOT.address);

    await componentList.setComponent(await index.WITHDRAW(), newWithdraw.address);
    await index.updateComponent(await index.WITHDRAW());
    assert.equal(await index.getComponentByName(await index.WITHDRAW()), newWithdraw.address);

    // Check we allowance
    const allowance = await mockMOT.allowance(index.address, newWithdraw.address);
    assert.isAbove(allowance.toNumber(), 10 ** 32, 0, "MOT is approved for new component");
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
    let tx;
    // With 0 supply price is 1 eth
    assert.equal((await index.totalSupply()).toNumber(), 0, "Starting supply is 0");
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"));

    tx = await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    tx = await index.invest({ value: web3.toWei(1, "ether"), from: investorB });

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
    const tokenAmounts = await index.getTokensAndAmounts();
    tokenAmounts[1].forEach(amount => assert.equal(amount, 0, "Amount is 0"));
  });

  it("Shall be able to request and withdraw", async () => {
    let tx;
    let tokenInWei = toTokenWei(1);

    assert.equal((await index.balanceOf(investorA)).toNumber(), tokenInWei, "A has invested");
    assert.equal((await index.balanceOf(investorB)).toNumber(), tokenInWei, "B has invested");

    // Request
    tx = await index.withdraw({ from: investorA });
    assert.equal((await index.balanceOf(investorA)).toNumber(), 0, " A has withdrawn");

    tx = await index.withdraw({ from: investorB });
    assert.equal((await index.balanceOf(investorB)).toNumber(), 0, "B has withdrawn");
  });



  it("Shall be able to buy tokens with eth", async () => {
    // From the preivus test we got 1.8 ETH

    await index.invest({ value: web3.toWei(1.8, "ether"), from: investorA });
    const initialIndexBalance = (await web3.eth.getBalance(index.address)).toNumber();

    assert.equal(initialIndexBalance, web3.toWei(1.8, "ether"), "Must start with 1.8 eth");

    await index.buyTokens();

    // Check amounts are correct
    const tokensAndAmounts = await index.getTokensAndAmounts();

    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );

    tokensAndAmounts[1].forEach((amount, index) => {
      const expectedAmount = expectedTokenAmount(initialIndexBalance, rates, index);
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
    tx = await index.withdraw({ from: investorA });

    // Investor has recover all his eth  tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await index.balanceOf(investorA)).toNumber(), toTokenWei(0), "Redeemed all");
    assert(await calc.inRange(investorAAfter - investorABefore, 1.8, 0.001), "Investor A received ether");

    // Price is constant
    assert.equal((await index.getPrice()).toNumber(), web3.toWei(1, "ether"), "Price keeps constant");
  });

  it("Shall be able to rebalance", async () => {
    let tx;
    let tokenAmounts;
    // Invest and get initial data
    await index.invest({ value: web3.toWei(1, "ether"), from: investorA });
    const initialIndexBalance = (await web3.eth.getBalance(index.address)).toNumber();
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );
    const extraAmount = +web3.toWei(1, "ether");
    // Buy tokens and sent to index, forcing increase his total assets value
    tx = await index.buyTokens();
    assert.ok(tx);

    assert.equal((await web3.eth.getBalance(index.address)).toNumber(), 0, "ETH used to buy"); // All ETH has been sald
    const initialAssetsValue = +(await index.getAssetsValue()).toNumber();

    exchange.buyToken(tokens[0], extraAmount, 0, index.address, 0x0, {
      value: extraAmount
    });
    const endTotalAssetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(endTotalAssetsValue, initialAssetsValue + extraAmount, "Increased Assets Value");

    // Execute Rebalance
    tx = await index.rebalance();
    assert.ok(tx);

    // Reblacance keep the amounts as per the wieghts
    tokenAmounts = await index.getTokensAndAmounts();
    tokenAmounts[1].forEach((amount, index) => {
      const expectedAmount = expectedTokenAmount(initialIndexBalance + extraAmount, rates, index);
      assert.equal(amount.toNumber(), expectedAmount, "Got expected amount");
    });
    // Price is updated because we force the total assets value increase while not the supply
    const price = (await index.getPrice()).toNumber();
    const supply = (await index.totalSupply()).toNumber();
    const priceInRange = await calc.inRange(price, (initialAssetsValue + extraAmount) * 10 ** indexData.decimals / supply, web3.toWei(0.00001, "ether"));
    assert.ok(priceInRange, "Price updated");

  });

  it("Shall be able to change the status", async () => {
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Status Is active");

    await index.changeStatus(DerivativeStatus.Paused);
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Paused, " Status is paused");

    await index.changeStatus(DerivativeStatus.Active);
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Status Is active");

    await calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.New), "Shall not change to New");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Cant change to new");

    await calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Closed), "Cant change to close");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Active, "Cant change to close");
  });

  it("Shall be able to close a index", async () => {
    await index.invest({ value: web3.toWei(1.8, "ether"), from: investorC });
    const price = (await index.getPrice()).toNumber();
    const priceInRange = await calc.inRange(
      (await index.balanceOf(investorC)).toNumber(),
      web3.toWei(toTokenWei(1.8) / price, "ether"),
      web3.toWei(0.001, "ether")
    );
    assert.ok(priceInRange, "C has invested");

    await index.buyTokens();

    await index.close();
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Status is closed");
    // TODO VERIFY TOKENS ARE SOLD
    for (let i = 0; i < indexData.tokensLenght; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(index.address);
      assert.equal(balance.toNumber(), 0, "Tokens are sold");
    }
    assert.equal((await index.getAssetsValue()).toNumber(), 0, "Assets value is 0");
    assert.isAbove((await web3.eth.getBalance(index.address)).toNumber(), 0, "ETH balance returned");
    await calc.assertReverts(async () => await index.changeStatus(DerivativeStatus.Active), "Shall keep close");
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, " Shall keep being closed");
  });

  it("Investor cant invest but can withdraw after close", async () => {
    assert.isAbove((await index.balanceOf(investorC)).toString(), 0, "C starting balance");

    // Investor cant invest can withdraw
    await calc.assertReverts(
      async () => await index.invest({ value: web3.toWei(1, "ether"), from: investorA }),
      "Cant invest after close"
    );
    // Request

    await index.withdraw({ from: investorC });

    assert.equal((await index.balanceOf(investorC)).toString(), 0, " C has withdrawn");
  });
});
