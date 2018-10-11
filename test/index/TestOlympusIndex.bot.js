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
  weights: [1, 9, 2, 8, 3, 7, 4, 6, 5, 10, 15, 20, 2, 5, 3],
  rebalanceDelta: 0
};

let processingBuyToken = false;
let processingRebalance = false;
let processingWithdraw = false;

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

const toTokenWei = amount => {
  return amount * 10 ** indexData.decimals;
};

const delay = async sec => {
  return new Promise(resolve => {
    setTimeout(resolve, sec);
  });
};

const availableStatus = async (index, current) => {
  const status = await index.productStatus();
  return status.toNumber() === 0 || status.toNumber() === current;
};

const availableWithdraw = async (index, asyncWithdraw) => {
  const available = await availableStatus(index, 1);
  const totalRequest = (await asyncWithdraw.getContractInfo(index.address))[2].toNumber();
  return available && totalRequest > 0;
};

const availableRebalance = async (index, rebalanceProvider) => {
  const available = await availableStatus(index, 2);
  try {
    const needs = await rebalanceProvider.needsRebalance.call(1, index.address);
    return available && needs;
  } catch (err) {
    console.log("err", err);
    return false;
  }
};

const availableBuyTokens = async index => {
  const available = await availableStatus(index, 3);
  let balance = (await index.getETHBalance()).toNumber();
  const result = available && balance > 1000;
  return result;
};

const safeRebalance = async (index, rebalanceProvider) => {
  if (processingRebalance) return;

  if (!availableRebalance(index, rebalanceProvider)) {
    return;
  }

  processingRebalance = true;

  try {
    const result = await index.rebalance.call();
    await index.rebalance();
    processingRebalance = false;
    if (!result) {
      console.log("safeRebalance:", result);
      await safeRebalance(index, rebalanceProvider);
    } else {
      console.log("rebalance done");
    }
  } catch (e) {
    if (e.message.includes("revert")) {
      console.log("safeRebalance revert");
      status = await index.productStatus();
      console.log("index status:", status.toNumber());
      await delay(1000);
      processingRebalance = false;
      await safeRebalance(index, rebalanceProvider);
    }
  }
};

const safeWithdraw = async (index, asyncWithdraw) => {
  if (processingWithdraw) return;
  if (!(await availableWithdraw(index, asyncWithdraw))) {
    return;
  }

  processingWithdraw = true;

  try {
    const result = await index.withdraw.call();
    await index.withdraw();
    processingWithdraw = false;
    if (!result) {
      console.log("safeWithdraw:", result);
      await safeWithdraw(index, asyncWithdraw);
    } else {
      console.log("withdraw done");
    }
  } catch (e) {
    if (e.message.includes("revert")) {
      const status = await index.productStatus();
      console.log("safeWithdraw revert", status.toNumber());
      await delay(1000);
      processingWithdraw = false;
      await safeWithdraw(index, asyncWithdraw);
    }
  }
};

const safeBuyTokens = async index => {
  if (processingBuyToken) return;

  if (!(await availableBuyTokens(index))) {
    return;
  }

  processingBuyToken = true;
  console.log("start buy token .......");
  try {
    const result = await index.buyTokens.call();
    console.log("buy tokens result", result);
    await index.buyTokens();

    processingBuyToken = false;
    if (!result) {
      console.log("buy token not finish", result);
      await safeBuyTokens(index);
    } else {
      console.log("buy tokens done");
    }
  } catch (e) {
    if (e.message.includes("revert")) {
      const status = await index.productStatus();
      console.log("safeBuyTokens revert", status.toNumber());
      await delay(1000);
      processingBuyToken = false;
      await safeBuyTokens(index);
    }
  }
};

contract.skip("Olympus Index Bot", accounts => {
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
  let allDone = false;

  const investorsGroupA = accounts.slice(1, 11);

  before("Initialize tokens", async () => {
    assert(accounts.length >= 11, "Require at least 11 investors for this test case");

    mockKyber = await MockKyberNetwork.deployed();
    const mockTokens = await mockKyber.supportedTokens();
    tokens = mockTokens.slice(0, indexData.weights.length);
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
    await mockKyber.setSlippageMockRate(100);

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
      tokens,
      indexData.weights,
      {
        gas: 8e6
      }
    );

    let status = (await index.status()).toNumber();
    assert.equal(status, 0, "step 1. Deploy should be success and status should be new");

    await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
      value: web3.toWei(indexData.ethDeposit, "ether")
    });

    await web3.eth.sendTransaction({
      from: accounts[0],
      to: mockKyber.address,
      value: "10000000000000000000"
    });

    price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "step 1. Price is 1 ether.");

    balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "step 1. Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(0, "ether"), "step 1. Total assets value is 0 ETH");
  });

  it("Simulate bot", async () => {
    setInterval(async () => {
      if (!allDone) await safeBuyTokens(index);
    }, 5000);

    setInterval(async () => {
      if (!allDone) await safeWithdraw(index, asyncWithdraw);
    }, 5000);

    setInterval(async () => {
      if (!allDone) await safeRebalance(index, rebalance);
    }, 15000);
  });

  it("Buy tokens", async () => {
    await Promise.all(
      investorsGroupA.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.1, "ether"),
            from: account
          })
      )
    );

    let assetsValue = (await index.getAssetsValue()).toNumber();
    console.log("invested assetsValue:", assetsValue);

    await delay(30000);

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "step 3. Price is 1 ETH");
    assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(1, "ether"), "step 3. Total assets value is 1 ETH");

    const ethBalance = (await index.getETHBalance()).toNumber();
    console.log("ethBalance", ethBalance);
    // 4. Each investor should have the index token balance of 0.1;
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        assert.equal(value, web3.toWei(0.1, "ether"), "should have the index token balance of 0.1");
        const balance = (await web3.eth.getBalance(account)).toNumber();
        console.log("account balance:", calc.fromWei(balance));
        console.log("Group A investors balance", calc.fromWei(value));
      })
    );

    // 5. Each token has amount, the percentage of index token is the same as the percentage we set while deploying the index.
    await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        assert.isAbove(amount, 0, "token should have amount");
      })
    );
  });

  it("buy tokens and withdraw", async () => {
    await Promise.all(
      investorsGroupA.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.1, "ether"),
            from: account
          })
      )
    );

    // await safeBuyTokens(index);

    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.05), {
          from: account
        });
      })
    );

    // await safeWithdraw(index);

    await delay(30000);

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "Price is 1 ETH");
    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(1.5, "ether"), "Total assets value is 1.5 ETH");
    balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");

    // Each investor should have the index token balance of 0.15, they also each receives 0.05 ETH back.
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        const balance = (await web3.eth.getBalance(account)).toNumber();
        assert.equal(value, web3.toWei(0.15, "ether"), "should have the index token balance of 0.15");
        console.log("account balance:", calc.fromWei(balance)); // 99.899840754 - 99.848889022 = 0.05 OK.
        console.log("Group A investors balance", calc.fromWei(value));
      })
    );
  });

  it("buy tokens and rebalance", async () => {
    // 1. Sends 10 MOT to the index;
    await erc20Token0.transfer(index.address, web3.toWei(10, "ether"), {
      from: accounts[0]
    });

    // 2. Group A 10 investors each invests 0.05 ETH;
    await Promise.all(
      investorsGroupA.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.05, "ether"),
            from: account
          })
      )
    );

    await delay(30000);

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is > 1");

    let balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    console.log("assetsValue:", calc.fromWei(assetsValue));

    // Each investor should have the index token balance of 0.2
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        const balance = (await web3.eth.getBalance(account)).toNumber();
        assert(calc.inRange(calc.fromWei(value), 0.2, 0.00001), "should have the index token balance of 0.15");
        console.log("account balance:", calc.fromWei(balance));
        console.log("Group A investors balance", calc.fromWei(value));
      })
    );
  });

  it("withdraw and rebalance", async () => {
    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.1), {
          from: account
        });
      })
    );

    // Sends another 50 MOT to the index;
    await erc20Token0.transfer(index.address, web3.toWei(50, "ether"), {
      from: accounts[0]
    });

    await delay(30000);

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is > 1");

    let balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(1, "ether"), "Total assets value is > 1 ETH;");

    // 4. Each investor should have the index token balance of 0.1, each of them also receives 0.1 ETH back;
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        console.log("Group A investors balance", calc.fromWei(value));
      })
    );

    // 5. Percentage of each tokens in the index should be the same as the percentage we set while deploying the index contract.
    const rates = await Promise.all(
      tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    );

    const percentages = await Promise.all(
      tokens.map(async token => {
        let erc20 = await ERC20.at(token);
        const amount = (await erc20.balanceOf(index.address)).toNumber();
        return calc.fromWei(amount);
      })
    );

    const total = percentages.reduce((a, b) => a + b);
    percentages.forEach((p, index) => {
      assert(
        calc.inRange((p * 100) / total, indexData.weights[index], 0.001),
        " each tokens in the index should be the same as the percentage"
      );
    });
  });

  it("buy tokens, withdraw and rebalance", async () => {
    // 1. Sends another 100 MOT to the index;
    await erc20Token0.transfer(index.address, web3.toWei(50, "ether"), {
      from: accounts[0]
    });

    // 2. Group A 10 investors each invests 0.1 ETH;
    await Promise.all(
      investorsGroupA.map(
        async account =>
          await index.invest({
            value: web3.toWei(0.1, "ether"),
            from: account
          })
      )
    );

    // 3. Group A 10 investors each requests withdraw 0.05 ETH;
    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.05), {
          from: account
        });
      })
    );

    await delay(30000);

    let price = (await index.getPrice()).toNumber();
    assert.isAbove(price, web3.toWei(1, "ether"), "Price is > 1");

    const totalSupply = await index.totalSupply();

    console.log("total , price:", totalSupply.toNumber(), price);

    let balance = (await index.getETHBalance()).toNumber();
    // assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");
    assert(calc.inRange(calc.fromWei(balance), 0, 0.00001), "Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(1.5, "ether"), "Total assets value is > 1.5 ETH;");

    // 4. Each investor should have the index token balance of 0.25;
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        console.log("Group A investors balance", calc.fromWei(value));
      })
    );

    // const rates = await Promise.all(
    //   tokens.map(async token => await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, "ether")))
    // );

    // console.log('rate:', rates);

    // 5. Percentage of each tokens in the index should be the same as the percentage we set while deploying the index contract.
    tokenAmounts = await getTokensAndAmounts(index);
    tokenAmounts[1].forEach((amount, index) => {
      // const expectedAmount = expectedTokenAmount(initialIndexBalance + extraAmount, rates, index);
      // assert.equal(amount.toNumber(), expectedAmount, "Got expected amount");
    });

    const amounts = tokenAmounts[1].map(amount => amount.toNumber());
    console.log("amounts:", amounts);
  });

  it("withdraw and close", async () => {
    await Promise.all(
      investorsGroupA.map(async account => {
        const balance = (await web3.eth.getBalance(account)).toNumber();
        console.log("account before balance:", calc.fromWei(balance));
      })
    );

    // allDone = true;
    // await delay(30000);
    // await safeWithdraw(index, asyncWithdraw);
    // 1. Group A investors each requests withdraw of 0.1 ETH;
    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.1), {
          from: account
        });
      })
    );

    await delay(30000);
    // 2. Owner closes the index;
    await index.close();
    await index.sellAllTokensOnClosedFund();

    // 3. Group A investors each requests withdraw rest of investment;
    await Promise.all(
      investorsGroupA.map(async account => {
        const amountInRequest = (await asyncWithdraw.getUserWithdrawBalance(index.address, account)).toNumber();
        // console.log('amountInRequest:', amountInRequest);
        const amount = (await index.balanceOf(account)).toNumber();
        await index.requestWithdraw(amount - amountInRequest, {
          from: account
        });
      })
    );

    await delay(30000);
    allDone = true;

    safeWithdraw(index, asyncWithdraw);

    let balance = (await index.getETHBalance()).toNumber();
    console.log("balance:", balance);
    // assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");
    assert(calc.inRange(calc.fromWei(balance), 0, 0.00001), "Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.isAbove(assetsValue, web3.toWei(0, "ether"), "Total assets value should be 0");
    console.log("assetsValue:", assetsValue);

    const totalSupply = await index.totalSupply();
    console.log("last totalSupply", totalSupply.toNumber());

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), "Price is 1");

    // 4. Group A investors have the index balance of 0, each of them also receives > 0.25 ETH;
    await Promise.all(
      investorsGroupA.map(async account => {
        const value = (await index.balanceOf(account)).toNumber();
        const balance = (await web3.eth.getBalance(account)).toNumber();
        assert(calc.inRange(calc.fromWei(value), 0, 0.00001), "should have the index token balance of 0");
        console.log("account final balance:", calc.fromWei(balance)); //
      })
    );
    // 5. Status of the index is still “Closed”
    assert.equal((await index.status()).toNumber(), DerivativeStatus.Closed, "Status of the index is Closed");
    // allDone = true;
  });
});
