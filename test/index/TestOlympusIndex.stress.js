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
  managementFee: 0,
  initialManagementFee: 0,
  wrongEthDeposit: 0.05,
  ethDeposit: 0.1,
  weights: [30, 20, 40, 10],
  maxTransfers: 10,
  rebalanceDelta: 0
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

const safeRebalance = async index => {
  const result = await index.rebalance.call();
  await index.rebalance();
  if (!result) {
    console.log("safeRebalance:", result);
    await safeRebalance(index);
  }
};

const safeWithdraw = async index => {
  const result = await index.withdraw.call();
  await index.withdraw();
  if (!result) {
    console.log("safeWithdraw:", result);
    await safeWithdraw(index);
  }
};

contract("Olympus Index Stress", accounts => {
  let index;
  let market;
  let mockKyber;
  let mockMOT;
  let exchange;
  let asyncWithdraw;
  let rebalance;
  let tokens;
  let componentList;
  let erc20Token0;
  let erc20Token1;
  let erc20Token2;
  let erc20Token3;

  const investorsGroupA = accounts.slice(1, 11);
  const investorsGroupB = accounts.slice(11, 21);

  before("Initialize tokens", async () => {
    assert(accounts.length >= 21, "Require at least 21 investors for this test case");

    mockKyber = await MockKyberNetwork.deployed();
    const mockTokens = await mockKyber.supportedTokens();
    tokens = mockTokens.slice(0, 4);
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
    await mockKyber.setSlippageMockRate(99);

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

    erc20Token0 = await ERC20.at(await tokens[0]);
    erc20Token1 = await ERC20.at(await tokens[1]);
    erc20Token2 = await ERC20.at(await tokens[2]);
    erc20Token3 = await ERC20.at(await tokens[3]);
  });

  it("Deploy index should be success", async () => {
    index = await OlympusIndex.new(
      indexData.name,
      indexData.symbol,
      indexData.description,
      indexData.category,
      indexData.decimals,
      tokens.slice(0, indexData.weights.length),
      indexData.weights,
      {
        gas: 8e6
      }
    );

    let status = (await index.status()).toNumber();
    assert.equal(status, 0, "Deploy should be success and status should be new");

    await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
      value: web3.toWei(indexData.ethDeposit, "ether")
    });
  });

  it("Buy tokens", async () => {
    let status = (await index.status()).toNumber();
    assert.equal(status, 1, "After initialized status should be 1");
    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "After initialized, Price should be 1 eth");

    await Promise.all(
      investorsGroupA.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.01, "ether"),
            from: account
          })
      )
    );

    await index.buyTokens();

    price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "After invested and buy tokens, price should be still 1");

    balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(0.1, "ether"), "Total assets value is 0.1 ETH");

    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0.01, "ether"), "Each investor should have the index token balance of 0.01");
      })
    );

    await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        assert.isAbove(amount, 0, "token should have amount");
      })
    );
  });

  it("Buy tokens and withdraw", async () => {
    // console.log('ba:', investorsGroupB[0]);
    // const ba = (await web3.eth.getBalance(investorsGroupB[0])).toNumber();

    await Promise.all(
      investorsGroupB.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.01, "ether"),
            from: account
          })
      )
    );

    const balances = {};
    await Promise.all(
      investorsGroupA.map(async account => {
        balances[account] = (await web3.eth.getBalance(account)).toNumber();
        await index.requestWithdraw(toTokenWei(0.005), {
          from: account
        });
      })
    );
    await index.buyTokens();
    await index.withdraw();

    let price = calc.fromWei((await index.getPrice()).toNumber());
    assert(calc.inRange(price, 1, 0.001), "Price is approx. to 1 ETH (may be a little bit up or down)");

    let balance = await index.getETHBalance();
    assert.equal(balance.toString(), web3.toWei(0, "ether"), "Total ETH balance is 0");

    let assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(0.15, "ether"), "Total assets value should be 0.15 ETH");

    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        const balance = (await web3.eth.getBalance(account)).toNumber();
        assert.equal(value, web3.toWei(0.005, "ether"), "Group B investors have the index balance of 0.005");
        assert.isAbove(balance, balances[account], "each investor has more than 99.98 ETH (they got eth back)");
      })
    );

    await Promise.all(
      investorsGroupB.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0.01, "ether"), "Group B investors have the index balance of 0.01");
      })
    );
  });

  it("Withdraw then buy tokens ", async () => {
    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.005), {
          from: account
        });
      })
    );

    await index.withdraw();

    await Promise.all(
      investorsGroupB.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.01, "ether"),
            from: account
          })
      )
    );

    await index.buyTokens();

    let price = calc.fromWei((await index.getPrice()).toNumber());
    assert(calc.inRange(price, 1, 0.001), "Price is approx. to 1 ETH (may be a little bit up or down)");

    let balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance is 0");

    let assetsValue = calc.fromWei((await index.getAssetsValue()).toNumber());
    assert(calc.inRange(assetsValue, 0.2, 0.001), "Total assets value should be 0.2 ETH");

    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0, "ether"), "Group A investors have the index balance of 0");
      })
    );

    await Promise.all(
      investorsGroupB.map(async account => {
        const value = await calc.ethBalance(account);
        assert(calc.inRange(value, 0.02, 0.001), "Group B investors have the index balance of 0.02");
      })
    );
  });

  it("Rebalance and buy tokens ", async () => {
    // Group B investors each invests another 0.01 ETH;
    await Promise.all(
      investorsGroupB.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.01, "ether"),
            from: account
          })
      )
    );

    const rawAmounts = await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        return amount;
      })
    );

    // At the same time, index manager send 100 MOT to the index address;
    await erc20Token0.transfer(index.address, web3.toWei(100, "ether"), {
      from: accounts[0]
    });

    // Record the current MOT, EOS, OMG, KNC amounts, the equivalent ETH value of MOT is now higher than the 30% of total assets value;
    const amounts = await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        return amount;
      })
    );

    assert.isAbove(amounts[0], rawAmounts[0], "MOT amount higher than the 30%");

    await safeRebalance(index);

    await index.buyTokens();

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is >1 ETH");

    let balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, 0, "Total ETH balance is 0");

    let assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(0.3, "ether"), "Total assets value should be > 0.3 ETH");

    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0, "ether"), "Group A investors have the index balance of 0");
      })
    );

    await Promise.all(
      investorsGroupB.map(async account => {
        const value = await calc.ethBalance(account);
        assert(calc.inRange(value, 0.02, 0.001), "Group B investors have the index balance of 0.3");
      })
    );

    const tokensWeights = await index.getTokens();
    const finalAmounts = await Promise.all(
      tokensWeights[0].map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        const price = await exchange.getPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", token, amount, 0);
        // console.log('price:', amount);
        return amount;
      })
    );

    console.log("amounts:", finalAmounts); // TODO
    // The balance of MOT, EOS, OMG, KNC is rebalanced to be equal to 30%, 20%, 40%, 10%.
  });

  it("Rebalance then withdraw ", async () => {
    // Group B investors each request withdraw 0.01 of the index;
    await Promise.all(
      investorsGroupB.map(async account => {
        await index.requestWithdraw(toTokenWei(0.01), {
          from: account
        });
      })
    );

    const rawAmounts = await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        return amount;
      })
    );

    // At the same time, index manager send 10 EOS to the index address;
    await erc20Token1.transfer(index.address, web3.toWei(100, "ether"), {
      from: accounts[0]
    });

    // Record the current MOT, EOS, OMG, KNC amounts, the equivalent ETH value of MOT is now higher than the 30% of total assets value;
    const amounts = await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        return amount;
      })
    );

    assert.isAbove(amounts[1], rawAmounts[1], "EOS amount higher than the 20%");
    // let fee = await index.accumulatedFee();
    // let balance = await web3.eth.getBalance(index.address);
    await safeRebalance(index);

    await index.withdraw();

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is >1 ETH");

    let ethBalance = (await index.getETHBalance()).toNumber();
    assert.equal(ethBalance, 0, "Total ETH balance is 0");

    let assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(0.2, "ether"), "Total assets value should be > 0.2 ETH");

    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0, "ether"), "Group A investors have the index balance of 0");
      })
    );

    await Promise.all(
      investorsGroupB.map(async account => {
        const value = await calc.ethBalance(account);
        assert(calc.inRange(value, 0.02, 0.001), "Group B investors have the index balance of 0.02");
      })
    );
  });

  it("Withdraw then close ", async () => {
    // Group B investors each request withdraw 0.01 of the index;
    await Promise.all(
      investorsGroupB.map(async account => {
        await index.requestWithdraw(toTokenWei(0.005), {
          from: account
        });
      })
    );

    await index.close();

    // mock send some eth to kyber.
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: mockKyber.address,
      value: "7000000000000000000"
    });

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is >1 ETH");

    let balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, 0, "Total ETH balance is 0");

    let assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(0.01, "ether"), "Total assets value should be > 0.01 ETH");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, "Status of the index is Closed");
  });

  it("Close then withdraw ", async () => {
    await Promise.all(
      investorsGroupB.map(async account => {
        const amountInRequest = (await asyncWithdraw.getUserWithdrawBalance(index.address, account)).toNumber();
        // console.log('amountInRequest:', amountInRequest);
        const amount = (await index.balanceOf(account)).toNumber();
        await index.requestWithdraw(amount - amountInRequest - 100, {
          from: account
        });
      })
    );

    await safeWithdraw(index);

    //------------ sell tokens then withdraw ---------- //
    await index.setMaxSteps(DerivativeProviders.GETETH, 3); // We have 4, we need to call twice

    await index.sellAllTokensOnClosedFund();

    await Promise.all(
      investorsGroupB.map(async account => {
        // console.log('amountInRequest:', amountInRequest);
        const amount = await index.balanceOf(account);
        await index.requestWithdraw(amount, {
          // 100 wei
          from: account
        });
      })
    );

    await calc.assertReverts(async () => await index.withdraw(), `Can't withdraw until all tokens are sold`);
    await index.sellAllTokensOnClosedFund();

    await index.withdraw();

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "Price is 1 ETH");

    let assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(0, "ether"), "Total assets value should be 0 ETH");

    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, "Status of the index is Closed");

    let fee = await index.accumulatedFee();
    await index.withdrawFee(fee);
    fee = await index.accumulatedFee();

    let totalBalance = await web3.eth.getBalance(index.address).toNumber();
    console.log("fee:", calc.fromWei(totalBalance), calc.fromWei(fee));

    let balance = (await index.getETHBalance()).toNumber();
    // assert.equal(balance, 0, 'Total ETH balance is 0');
    assert(calc.inRange(balance, 0, 0.00001), "Total ETH balance is 0");
  });
});
