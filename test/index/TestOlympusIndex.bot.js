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
//  1%, 9%, 2%, 8%, 3%, 7%, 4%, 6%, 5%, 10%, 15%, 20%, 2.2%, 4.55%, 3.25%

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
  //   weights: [10, 1, 29, 5, 5, 10, 20, 10, 10],
  weights: [1, 9, 2, 8, 3, 7, 4, 6, 5, 10, 15, 20, 2, 5, 3],
  rebalanceDelta: 0
};

const toTokenWei = amount => {
  return amount * 10 ** indexData.decimals;
};

const expectedTokenAmount = (balance, rates, tokenIndex) => {
  // Balance ETH * (weight)%  * tokenRate / ETH  ==> Expected tokenAmount
  return (balance * (indexData.weights[tokenIndex] / 100) * rates[0][tokenIndex].toNumber()) / 10 ** 18;
};

const delay = async (sec) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec);
  });
}

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
  console.log('start rebalance ...')
  const result = await index.rebalance.call();
  await index.rebalance();
  if (!result) {
    console.log('safeRebalance:', result)
    await safeRebalance(index);
  } else {
    console.log('rebalance done')
  }
}

const safeWithdraw = async index => {
  console.log('start withdraw ...')
  const result = await index.withdraw.call();
  await index.withdraw();
  if (!result) {
    console.log('safeWithdraw:', result)
    await safeWithdraw(index);
  } else {
    console.log('withdraw done')
  }
}

const safeBuyTokens = async index => {
  console.log('start buy tokens ...')
  const result = await index.buyTokens.call();
  await index.buyTokens();
  if (!result) {
    console.log('safeBuyTokens:', result)
    await buyTokens(index);
  } else {
    console.log('buy tokens done')
  }
}

contract("Olympus Index", accounts => {

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
  const investorsGroupB = accounts.slice(11);

  before("Initialize tokens", async () => {

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
      indexData.weights, {
        gas: 8e6
      }
    );

    let status = (await index.status()).toNumber();
    assert.equal(status, 0, 'step 1. Deploy should be success and status should be new');

    await index.initialize(componentList.address, indexData.initialManagementFee, indexData.rebalanceDelta, {
      value: web3.toWei(indexData.ethDeposit, "ether")
    });

    price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), 'step 1. Price is 1');

    balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "step 1. Total ETH balance now is 0");

    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(0, "ether"), "step 1. Total assets value is 0 ETH");

  });


  it("Simulate bot", async () => {

    setInterval(async () => {
      await safeBuyTokens(index);
    }, 10000);

    setInterval(async () => {
      await safeWithdraw(index);
    }, 12000);

    setInterval(async () => {
      await safeRebalance(index);
    }, 30000);

  });

  it("Buy tokens", async () => {

    await Promise.all(
      investorsGroupA.map(async account => await index.invest({
        value: web3.toWei(0.1, "ether"),
        from: account
      }))
    );

    await delay(40000);

    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), 'step 3. Price is 1 ETH');
    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(1, "ether"), "step 3. Total assets value is 1 ETH");
    // 4. Each investor should have the index token balance of 0.1;
    // 5. Each token has amount, the percentage of index token is the same as the percentage we set while deploying the index.

  });

  it("buy tokens and withdraw", async () => {

    await Promise.all(
      investorsGroupA.map(async account => await index.invest({
        value: web3.toWei(0.1, "ether"),
        from: account
      }))
    );

    await Promise.all(
      investorsGroupA.map(async account => {
        await index.requestWithdraw(toTokenWei(0.01), {
          from: account
        });
      })
    );

    await delay(85000);
    let price = (await index.getPrice()).toNumber();
    assert.equal(price, web3.toWei(1, "ether"), 'Price is 1 ETH');
    const assetsValue = (await index.getAssetsValue()).toNumber();
    assert.equal(assetsValue, web3.toWei(1.5, "ether"), "Total assets value is 1.5 ETH");
    balance = (await index.getETHBalance()).toNumber();
    assert.equal(balance, web3.toWei(0, "ether"), "Total ETH balance now is 0");

    // Each investor should have the index token balance of 0.15, they also each receives 0.05 ETH back.

  })



});
