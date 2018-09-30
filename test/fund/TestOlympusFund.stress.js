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
  wrongEthDeposit: 0.05,
  ethDeposit: 0.5, // ETH
  maxTransfers: 10
};

const toTokenWei = amount => {
  return amount * 10 ** fundData.decimals;
};

contract("Fund Stress", accounts => {
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
  const investorD = accounts[4];
  const investorE = accounts[5];
  const investorF = accounts[6];
  const investorG = accounts[7];
  const investorH = accounts[8];
  const investorI = accounts[9];
  const investorJ = accounts[10];

  const investorK = accounts[11];
  const investorL = accounts[12];
  const investorM = accounts[13];
  const investorN = accounts[14];
  const investorO = accounts[15];
  const investorP = accounts[16];
  const investorQ = accounts[17];
  const investorR = accounts[18];
  const investorS = accounts[19];
  const investorT = accounts[20];

  const GroupA = [
    investorA,
    investorB,
    investorC,
    investorD,
    investorE,
    investorF,
    investorG,
    investorH,
    investorI,
    investorJ
  ];
  const GroupB = [
    investorK,
    investorL,
    investorM,
    investorN,
    investorO,
    investorP,
    investorQ,
    investorR,
    investorS,
    investorT
  ];

  let KNC;
  let EOS;
  let MOT;

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
    KNC = tokens[0];
    EOS = tokens[1];
    MOT = tokens[2];
  });
  // ----------------------------- REQUIRED FOR CREATION ----------------------
  it("Create a fund", async () => {
    fund = await Fund.new(fundData.name, fundData.symbol, fundData.description, fundData.category, fundData.decimals);
    assert.equal((await fund.status()).toNumber(), 0); // new

    await calc.assertReverts(async () => {
      await fund.initialize(componentList.address, fundData.initialManagementFee, fundData.withdrawInterval, {
        value: web3.toWei(fundData.wrongEthDeposit, "ether")
      });
    }, "initial ETH should be equal or more than 0.1 ETH");

    await fund.initialize(componentList.address, fundData.initialManagementFee, fundData.withdrawInterval, {
      value: web3.toWei(fundData.ethDeposit, "ether")
    });
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], fund.address);
    assert.equal((await fund.status()).toNumber(), 1); // Active
    // The fee send is not taken in account in the price but as a fee
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));
    assert.equal((await fund.accumulatedFee()).toNumber(), web3.toWei(0.5, "ether"));
  });

  it("Invest 10 times and buy tokens", async () => {
    for (let i = 0; i < GroupB.length; i++) {
      await fund.invest({
        value: web3.toWei(0.01, "ether"),
        from: GroupA[i]
      });
    }

    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    const rates_KNC = await mockKyber.getExpectedRate(ethToken, KNC, web3.toWei(0.05, "ether"));
    const rates_EOS = await mockKyber.getExpectedRate(ethToken, EOS, web3.toWei(0.05, "ether"));

    const amounts = [web3.toWei(0.05, "ether"), web3.toWei(0.05, "ether")];

    let tx;
    tx = await fund.buyTokens("", [KNC, EOS], amounts, [10 ** 21, 10 ** 21]); //bignumber to number
    const fundTokensAndBalance = await fund.getTokens();
    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), web3.toWei(0.01, "ether"), "Group has invest 0.001");
    }

    assert.equal(fundTokensAndBalance[0][0], KNC, "Token exist in fund");
    assert.equal(fundTokensAndBalance[0][1], EOS, "Token exist in fund");

    assert.equal(fundTokensAndBalance[1][0].toNumber(), 0.05 * 10 ** 21, "Balance is correct in the fund");
    assert.equal(fundTokensAndBalance[1][1].toNumber(), 0.05 * 10 ** 21, "Balance is correct in the fund");
  });

  it("Sell tokens then buy tokens", async () => {
    for (let i = 0; i < GroupB.length; i++) {
      await fund.invest({
        value: web3.toWei(0.01, "ether"),
        from: GroupB[i]
      });
    }
    const rates_KNC = await mockKyber.getExpectedRate(ethToken, KNC, web3.toWei(0.05, "ether"));
    const rates_EOS = await mockKyber.getExpectedRate(ethToken, EOS, web3.toWei(0.05, "ether"));
    let fundTokensAndBalance = await fund.getTokens();
    await fund.sellTokens(
      "",
      fundTokensAndBalance[0],
      [fundTokensAndBalance[1][0] * 0.5, fundTokensAndBalance[1][1] * 0.5],
      [10 ** 15, 10 ** 15]
    ); //bignumber to number
    let amount = await fund.getETHBalance();
    await fund.buyTokens("", [MOT], [amount], [10 ** 21]); //bignumber to number

    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), web3.toWei(0.01, "ether"), "Group has invest 0.001");
    }
    for (let i = 0; i < GroupB.length; i++) {
      assert.equal((await fund.balanceOf(GroupB[i])).toNumber(), web3.toWei(0.01, "ether"), "Group has invest 0.001");
    }
    let NewfundTokensAndBalance = await fund.getTokens(); //reload the balance

    assert.equal(NewfundTokensAndBalance[0][0], KNC, "KNC Token exist in fund");
    assert.equal(NewfundTokensAndBalance[0][1], EOS, "EOS Token exist in fund");
    assert.equal(NewfundTokensAndBalance[0][2], MOT, "MOT Token exist in fund");
    assert.equal(NewfundTokensAndBalance[1][0].toNumber(), 0.05 * 0.5 * 10 ** 21, "KNC Balance is correct in the fund");
    assert.equal(NewfundTokensAndBalance[1][1].toNumber(), 0.05 * 0.5 * 10 ** 21, "EOS Balance is correct in the fund");
    assert.equal(NewfundTokensAndBalance[1][2].toNumber(), 0.15 * 10 ** 21, "MOT Balance is correct in the fund");
  });

  it("Buy tokens then withdraw", async () => {
    for (let i = 0; i < GroupB.length; i++) {
      await fund.invest({
        value: web3.toWei(0.01, "ether"),
        from: GroupB[i]
      });
    }

    for (let i = 0; i < GroupA.length; i++) {
      await fund.requestWithdraw(toTokenWei(0.005), { from: GroupA[i] });
    }

    let amount = await fund.getETHBalance(); //0.1ETH from GroupB
    await fund.buyTokens("", [MOT], [amount], [10 ** 21]); //bignumber to number

    await fund.withdraw();

    assert(
      await calc.inRange((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"), web3.toWei(0.001, "ether")),
      "Price Changed"
    );
    assert(
      await calc.inRange(
        (await fund.getAssetsValue()).toNumber(),
        web3.toWei(0.25, "ether"),
        web3.toWei(0.001, "ether")
      ),
      "Assets Value Changed"
    );

    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), web3.toWei(0.005, "ether"), "GroupA has invest 0.005");
    }
    for (let i = 0; i < GroupB.length; i++) {
      assert.equal((await fund.balanceOf(GroupB[i])).toNumber(), web3.toWei(0.02, "ether"), "GroupB has invest 0.02");
    }
    let NewfundTokensAndBalance = await fund.getTokens(); //reload the balance
    assert.equal(NewfundTokensAndBalance[0][0], KNC, "KNC Token exist in fund");
    assert.equal(NewfundTokensAndBalance[0][1], EOS, "EOS Token exist in fund");
    assert.equal(NewfundTokensAndBalance[0][2], MOT, "MOT Token exist in fund");
  });

  it("sell tokens then withdraw", async () => {
    let fundTokensAndBalance = await fund.getTokens();
    await fund.sellTokens("", [MOT], [fundTokensAndBalance[1][2]], [10 ** 15]);
    for (let i = 0; i < GroupA.length; i++) {
      await fund.requestWithdraw(toTokenWei(0.005), { from: GroupA[i] });
    }
    await fund.withdraw();
    assert(
      await calc.inRange(
        (await fund.getPrice()).toNumber(),
        web3.toWei(1, "ether"),
        web3.toWei(0.001, "ether"),
        "Price Changed"
      )
    );
    assert(
      await calc.inRange(
        (await fund.getAssetsValue()).toNumber(),
        web3.toWei(0.041, "ether"),
        web3.toWei(0.1, "ether")
      ),
      "Assets Value Changed"
    );
    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), 0, "GroupA has invest 0.00");
    }
    for (let i = 0; i < GroupB.length; i++) {
      assert.equal((await fund.balanceOf(GroupB[i])).toNumber(), web3.toWei(0.02, "ether"), "GroupB has invest 0.02");
    }
  });
  it("Withdraw then sell tokens", async () => {
    for (let i = 0; i < GroupB.length; i++) {
      await fund.requestWithdraw(toTokenWei(0.02), { from: GroupB[i] });
    }
    await fund.withdraw();
    let fundTokensAndBalance = await fund.getTokens();
    await fund.sellTokens(
      "",
      [KNC, EOS],
      [fundTokensAndBalance[1][0], fundTokensAndBalance[1][1]],
      [10 ** 15, 10 ** 15]
    );
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether")); //"Price Changed"
    assert(await calc.inRange((await fund.getAssetsValue()).toNumber(), 0, 0.1), "Assets Value Changed");

    let NewfundTokensAndBalance = await fund.getTokens(); //reload the balance

    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), 0, "GroupA has invest 0.00");
    }
    for (let i = 0; i < GroupB.length; i++) {
      assert.equal((await fund.balanceOf(GroupB[i])).toNumber(), 0, "GroupB has invest 0.00");
    }
    assert.equal(NewfundTokensAndBalance[1][0].toNumber(), 0, "KNC Balance is correct in the fund");
    assert.equal(NewfundTokensAndBalance[1][1].toNumber(), 0, "EOS Balance is correct in the fund");
  });
  it("Withdraw then close", async () => {
    for (let i = 0; i < GroupB.length; i++) {
      await fund.invest({
        value: web3.toWei(0.01, "ether"),
        from: GroupA[i]
      });
    }

    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    const rates_KNC = await mockKyber.getExpectedRate(ethToken, KNC, web3.toWei(0.05, "ether"));
    const rates_EOS = await mockKyber.getExpectedRate(ethToken, EOS, web3.toWei(0.05, "ether"));

    const amounts = [web3.toWei(0.05, "ether"), web3.toWei(0.05, "ether")];

    let tx;
    tx = await fund.buyTokens("", [KNC, EOS], amounts, [10 ** 21, 10 ** 21]); //bignumber to number
    const fundTokensAndBalance = await fund.getTokens();
    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), web3.toWei(0.01, "ether"), "Group has invest 0.001");
    }

    assert.equal(fundTokensAndBalance[0][0], KNC, "Token exist in fund");
    assert.equal(fundTokensAndBalance[0][1], EOS, "Token exist in fund");

    assert.equal(fundTokensAndBalance[1][0].toNumber(), 0.05 * 10 ** 21, "Balance is correct in the fund");
    assert.equal(fundTokensAndBalance[1][1].toNumber(), 0.05 * 10 ** 21, "Balance is correct in the fund");

    for (let i = 0; i < GroupA.length; i++) {
      await fund.requestWithdraw(toTokenWei(0.005), { from: GroupA[i] });
    }
    await fund.close();

    await calc.assertReverts(async () => {
      await fund.sellAllTokensOnClosedFund();
    }, "There are withdraw requests which are not handled yet");

    await fund.withdraw();
    await fund.sellAllTokensOnClosedFund();

    assert.equal((await fund.status()).toNumber(), 3, " Status is closed");
  });
  it("Close then withdraw", async () => {
    for (let i = 0; i < GroupA.length; i++) {
      // Withdraws the ETH immediately, because all assets are sold and the fund is closed.
      await fund.requestWithdraw(toTokenWei(0.005), { from: GroupA[i] });
    }

    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, "ether"));

    assert.equal((await fund.getAssetsValue()).toNumber(), 0); // "Assets Value Changed"

    let NewfundTokensAndBalance = await fund.getTokens(); //reload the balance

    for (let i = 0; i < GroupA.length; i++) {
      assert.equal((await fund.balanceOf(GroupA[i])).toNumber(), 0, "GroupA has invest 0.00");
    }
    for (let i = 0; i < GroupB.length; i++) {
      assert.equal((await fund.balanceOf(GroupB[i])).toNumber(), 0, "GroupB has invest 0.00");
    }
    assert.equal(NewfundTokensAndBalance[1][0].toNumber(), 0, "KNC Balance is correct in the fund");
    assert.equal(NewfundTokensAndBalance[1][1].toNumber(), 0, "EOS Balance is correct in the fund");
    assert.equal(NewfundTokensAndBalance[1][2].toNumber(), 0, "MOT Balance is correct in the fund");
    assert.equal((await fund.status()).toNumber(), 3, " Status is closed");
  });
});
