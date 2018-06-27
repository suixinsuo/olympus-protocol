const log = require('../utils/log');
const calc = require('../utils/calc');

const Fund = artifacts.require("OlympusFund");
const AsyncWithdraw = artifacts.require("../../contracts/components/widrwaw/AsyncWithdraw.sol");
const RiskControl = artifacts.require("../../contracts/components/RiskControl.sol");
const Marketplace = artifacts.require("../../contracts/Marketplace.sol");
const PercentageFee = artifacts.require("../../contracts/components/fee/PercentageFee.sol");
const Reimbursable = artifacts.require("../../contracts/components/fee/Reimbursable.sol");

// Buy and sell tokens
const ExchangeProvider = artifacts.require("../contracts/components/exchange/ExchangeProvider");
const MockKyberNetwork = artifacts.require("../contracts/components/exchange/exchanges/MockKyberNetwork");
const ERC20 = artifacts.require("../contracts/libs/ERC20Extended");


// Constants

const ethToken = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
let DerivativeStatus = { New: 0, Active: 1, Paused: 2, Closed: 3 };
const fundData = {
  name: 'OlympusFund',
  symbol: 'MOF',
  description: 'Sample of real fund',
  decimals: 18,
  managmentFee: 0.1,
  ethDeposit: 0.5, // ETH
}

const toToken = (amount) => {
  return amount * 10 ** fundData.decimals;
}



contract('Fund', (accounts) => {
  let fund;
  let market;
  let mockKyber;
  let tokens;
  const investorA = accounts[1];
  const investorB = accounts[2];


  it('Create a fund', async () => {

    market = await Marketplace.deployed();
    mockKyber = await MockKyberNetwork.deployed();
    tokens = await mockKyber.supportedTokens();
    fund = await Fund.new(
      fundData.name,
      fundData.symbol,
      fundData.description,
      fundData.decimals
    );
    assert.equal((await fund.status()).toNumber(), 0); // new

    try {
      await fund.changeStatus(DerivativeStatus.Active);
      assert(false, 'Shall not be able to from New to other status')
    } catch (e) {
      assert.equal((await fund.status()).toNumber(), DerivativeStatus.New, 'Must be still new');

    }

    await fund.initialize(
      Marketplace.address,
      ExchangeProvider.address, // Exchange, TODO add
      AsyncWithdraw.address,
      RiskControl.address,
      0x01, // Whitelist, to do
      Reimbursable.address,
      PercentageFee.address,
      0,
      { value: web3.toWei(fundData.ethDeposit, 'ether') }
    );
    const myProducts = await market.getOwnProducts();

    assert.equal(myProducts.length, 1);
    assert.equal(myProducts[0], fund.address);
    assert.equal((await fund.status()).toNumber(), 1); // Active
    // The fee send is not taked in account in the price but as a fee
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'));
    assert.equal((await fund.accumulatedFee()).toNumber(), web3.toWei(0.5, 'ether'));

  });

  it("Fund shall be able deploy", async () => log.catch(async () => {
    assert.equal((await fund.name()), fundData.name);
    assert.equal((await fund.description()), fundData.description);
    assert.equal((await fund.symbol()), fundData.symbol);
    assert.equal((await fund.version()), "1.0");

  }));

  it("Fund shall allow investment", async () => log.catch(async () => {

    // With 0 supply price is 1 eth
    assert.equal((await fund.totalSupply()).toNumber(), 0, 'Starting supply is 0');
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'));

    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorA });
    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorB });

    assert.equal((await fund.totalSupply()).toNumber(), web3.toWei(2, 'ether'), 'Supply is updated');
    // Price is the same, as no Token value has changed
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'));

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toToken(1));
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toToken(1));

  }));



  it("Shall be able to request and withdraw", async () => log.catch(async () => {
    let tx;
    await fund.setMaxTransfers(1); // For testing

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toToken(1), 'A has invested');
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toToken(1), 'B has invested');

    // Request
    await fund.requestWithdraw(toToken(1), { from: investorA });
    await fund.requestWithdraw(toToken(1), { from: investorB });

    // Withdraw max transfers is set to 1
    tx = await fund.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, ' Owner got Reimbursed');

    assert.equal(await fund.withdrawInProgress(), true, ' Withdraw has not finished');
    assert.equal((await fund.balanceOf(investorA)).toNumber(), 0, ' A has withdraw');
    assert.equal((await fund.balanceOf(investorB)).toNumber(), toToken(1), ' B has no withdraw');

    // Second withdraw succeeds
    tx = await fund.withdraw();
    assert(calc.getEvent(tx, "Reimbursed").args.amount.toNumber() > 0, ' Owner got Reimbursed 2');

    assert.equal(await fund.withdrawInProgress(), false, ' Withdraw has finished');
    assert.equal((await fund.balanceOf(investorB)).toNumber(), 0, 'B has withdraw');

    await fund.setMaxTransfers(10); // Restore

  }))

  it("Manager shall be able to collect a from investment and withdraw it", async () => log.catch(async () => {
    // Set fee
    const denominator = (await (await PercentageFee.deployed()).DENOMINATOR()).toNumber();
    await fund.setManagementFee(fundData.managmentFee * denominator);
    assert.equal((await fund.getManagementFee()).toNumber(), fundData.managmentFee * denominator, 'Fee is set correctly');
    // Invest two times (two different logics for first time and others)
    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorA });

    await fund.invest({ value: web3.toWei(1, 'ether'), from: investorA });

    const expectedFee = 0.5 + 0.2 - 0.01; // Base Fee + Fee from investments - commision of withdraw
    assert(calc.inRange(
      (await fund.accumulatedFee()).toNumber(),
      web3.toWei(expectedFee, 'ether'),
      web3.toWei(0.1, 'ether')),
      'Owner got fee');

    assert.equal((await fund.balanceOf(investorA)).toNumber(), toToken(1.8), 'A has invested with fee');

    // Withdraw
    const ownerBalanceInital = await calc.ethBalance(accounts[0]);
    await fund.witdrawFee(web3.toWei(0.2, 'ether'));

    assert(calc.inRange(
      (await fund.accumulatedFee()).toNumber(),
      web3.toWei(expectedFee - 0.2, 'ether'),
      web3.toWei(0.1, 'ether')),
      'Owner pending fee');

    const ownerBalanceAfter = await calc.ethBalance(accounts[0]);

    assert.equal(
      calc.roundTo(ownerBalanceInital + (2 * fundData.managmentFee), 2),
      calc.roundTo(ownerBalanceAfter, 2), 'Owner received ether');

  }));
  it("Buy  tokens fails if ethr required is not enough", async () => log.catch(async () => {
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'This test must start with 1.8 eth');
    try {
      const amounts = [web3.toWei(1, 'ether'), web3.toWei(1, 'ether')];
      await fund.buyTokens(0x0, tokens, amounts, rates.map((rate) => rate[0]));
    } catch (e) {
      assert(true, 'reverte if fund balance is not enough');
    }
  }))

  it("Shall be able to buy  tokens", async () => log.catch(async () => {

    // From the preivus test we got 1.8 ETH
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'This test must start with 1.8 eth');

    const rates = await Promise.all(tokens.map(async (token) => (await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, 'ether')))))
    const amounts = [web3.toWei(0.5, 'ether'), web3.toWei(0.5, 'ether')];

    await fund.buyTokens("", tokens, amounts, rates.map((rate) => rate[0]));

    const fundTokensAndBalance = await fund.getTokens();
    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance, 0.5 * rates[i][0], ' Fund get ERC20 correct balance');
      // Check the fund data is updated correctly
      assert.equal(fundTokensAndBalance[0][i], tokens[i], 'Token exist in fund');
      assert.equal(fundTokensAndBalance[1][i].toNumber(), 0.5 * rates[i][0], 'Balance is correct in th fund');
    }

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'), 'Price keeps constant after buy tokens');
    // ETH balance is reduced
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0.8, 'ether'), 'ETH balance reduced');
  }));

  it("Shall be able to sell  tokens", async () => log.catch(async () => {

    // From the preivus test we got 1.8 ETH
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0.8, 'ether'), 'This test must start with 1.8 eth');
    let fundTokensAndBalance = await fund.getTokens();

    const sellRates = await Promise.all(tokens.map(async (token, index) => (await mockKyber.getExpectedRate(token, ethToken, fundTokensAndBalance[1][index]))))
    // We sell all
    await fund.sellTokens("", fundTokensAndBalance[0], fundTokensAndBalance[1], sellRates.map((rate) => rate[0]));

    fundTokensAndBalance = await fund.getTokens();

    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance.toNumber(), 0, ' Fund get ERC20 correct balance');
      // Check the fund data is updated correctly
      assert.equal(fundTokensAndBalance[0][i], tokens[i], 'Token exist in fund');
      assert.equal(fundTokensAndBalance[1][i].toNumber(), 0, 'Balance is correct in the fund');
    }

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'), 'Price keeps constant after buy tokens');
    // ETH balance is reduced
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'ETH balance reduced');
  }));


  it("Shall be able to sell tokens to get enough eth for withdraw", async () => log.catch(async () => {

    // From the preivus test we got 1.8 ETH, and investor got 1.8 Token
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'This test must start with 1.8 eth');
    assert.equal((await fund.balanceOf(investorA)).toNumber(), toToken(1.8), 'A has invested with fee');
    const investorABefore = await calc.ethBalance(investorA);

    const rates = await Promise.all(tokens.map(async (token) => (await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, 'ether')))))
    const amounts = [web3.toWei(0.9, 'ether'), web3.toWei(0.9, 'ether')];
    await fund.buyTokens("", tokens, amounts, rates.map((rate) => rate[0]));

    for (let i = 0; i < tokens.length; i++) {
      let erc20 = await ERC20.at(tokens[i]);
      let balance = await erc20.balanceOf(fund.address);
      assert.equal(balance.toNumber(), 0.9 * rates[i][0], ' Fund get ERC20 correct balance');
    }

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0, 'ether'), 'We sold all into tokens');

    // Request
    await fund.requestWithdraw(toToken(1.8), { from: investorA });
    tx = await fund.withdraw();


    // Investor has recover all his eth sepp9jgt tokens
    const investorAAfter = await calc.ethBalance(investorA);
    assert.equal((await fund.balanceOf(investorA)).toNumber(), toToken(0), 'Investor redeemed all the founds');
    assert.equal(
      calc.roundTo(investorABefore + 1.8, 2),
      calc.roundTo(investorAAfter, 2), 'Owner received ether');

    // Price is constant
    assert.equal((await fund.getPrice()).toNumber(), web3.toWei(1, 'ether'), 'Price keeps constant after buy tokens');



  }));


  it.skip("Shall be able to dispatch a broken token", async () => log.catch(async () => {

  }));

  it("Shall be able to change the status", async () => log.catch(async () => {


    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, 'Status Is active');
    await fund.changeStatus(DerivativeStatus.Paused);
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Paused, ' Status is paused');
    await fund.changeStatus(DerivativeStatus.Active);
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, 'Status Is active');
    try {
      await fund.changeStatus(DerivativeStatus.New);
      assert(false, 'Shall not be able to change to New')
    } catch (e) {
      assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, ' Cant change to new, shall keep being previous');
    }

    try {
      await fund.changeStatus(DerivativeStatus.Closed);
      assert(false, 'Shall not be able to change to Close')
    } catch (e) {
      assert.equal((await fund.status()).toNumber(), DerivativeStatus.Active, ' Cant change to close, shall keep being previous');
    }

  }));

  it("Shall be able to close a fund", async () => log.catch(async () => {

    await fund.invest({ value: web3.toWei(2, 'ether'), from: accounts[3] });

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'This test must start with 1.8 eth');
    assert.equal((await fund.balanceOf(accounts[3])).toNumber(), toToken(1.8), 'A has invested with fee');

    const rates = await Promise.all(tokens.map(async (token) => (await mockKyber.getExpectedRate(ethToken, token, web3.toWei(0.5, 'ether')))))
    const amounts = [web3.toWei(0.9, 'ether'), web3.toWei(0.9, 'ether')];
    await fund.buyTokens("", tokens, amounts, rates.map((rate) => rate[0]));

    // ETH balance is reduced
    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(0, 'ether'), 'ETH balance reduced');

    await fund.close();
    assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, ' Status is closed');

    assert.equal((await fund.getETHBalance()).toNumber(), web3.toWei(1.8, 'ether'), 'ETH balance returned');
    try {
      await fund.changeStatus(DerivativeStatus.Active);
      assert(false, 'Shall not be able to change from close')
    } catch (e) {
      assert.equal((await fund.status()).toNumber(), DerivativeStatus.Closed, ' Cant change to active, shall keep being closed');
    }

  }));


});
