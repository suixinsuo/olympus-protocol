
'use strict';
const log = require('./utils/log');

const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const RiskManagementProvider = artifacts.require("../contracts/riskManagement/RiskManagementProvider.sol");
const PriceProvider = artifacts.require("../contracts/price/PriceProvider.sol");
const MockKyberNetwork = artifacts.require("../contracts/exchange/exchanges/MockKyberNetwork.sol");
const Core = artifacts.require("../contracts/OlympusLabsCore.sol");
const ExchangeProvider = artifacts.require("../contracts/exchange/ExchangeProvider.sol");
const KyberNetworkExchange = artifacts.require("../contracts/exchange/exchanges/KyberNetworkExchange.sol");
const ExchangeAdapterManager = artifacts.require("../contracts/exchange/ExchangeAdapterManager.sol");
const SimpleERC20Token = artifacts.require("../contracts/libs/SimpleERC20Token.sol");


const FundTemplate = artifacts.require("FundTemplate");

const DENOMINATOR = 10000;
const olympusFee = 300; // Denominator is 10.000, so 3%
const ETH = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
const EMPTY_ADDRESS = 0x0000000000000000000000000000000000000000;
const OFFSET = 0.1 * 10 ** 18; // 0.1 ETH offset for fees
const OFFSET_TOKEN = 0.001 * 10 ** 21; // 10 ERC 20 Token offset for exchanges

const fundData = {
  id: 1,
  name: 'Test',
  symbol: 'TEST',
  description: 'Is a fund for test',
  decimals: 18,
  category: 'testing',
  // EOS,  Mana
  address: [], // Initialized from  mockup provider
  magementeFee: 100, // 1% Denominator is 10.000, so 1%
  tokenPrices: [100, 200],

}
const toFundToken = (amount) => {
  return amount * 10 ** fundData.decimals;
}


contract("Fund For Manager", (accounts) => {

  let fund;

  const coreAddress = accounts[1];
  const investorA = accounts[2];

  before('Deploy Fund Managment', async () => {
    let permissionProvider = await PermissionProvider.deployed();
    let riskProvider = await RiskManagementProvider.deployed();
    let priceProvider = await PriceProvider.deployed();
    const mockKyber = await MockKyberNetwork.deployed();
    await priceProvider.setKyber(mockKyber.address);
    permissionProvider.adminAdd(coreAddress, await permissionProvider.ROLE_CORE());


    fund = await FundTemplate.new(fundData.symbol, fundData.name, fundData.decimals);
    await fund.setPermissionProvider(permissionProvider.address);
    await fund.setPriceProvider(priceProvider.address);
    await fund.setRiskProvider(riskProvider.address);

    // Enable fund
    // Update the mock data with the mock kyber
    fundData.addresses = await mockKyber.supportedTokens();
    fund.setManageFee(fundData.magementeFee);

    // Create the fund
    await fund.createFundDetails(fundData.id,
      fundData.name,
      fundData.description,
      fundData.category,
      0, // withdraw fee Cicle
      0, // Withdraw from fund
    );
  })

  it("Should be able to change the core fee.", async () => {
    assert(await fund.olympusFee(), 0);
    await fund.setOlympusFee(olympusFee, { from: coreAddress });
    assert(await fund.olympusFee(), olympusFee);

  })

  it("Should be reject change fee without permissions.", async () => {
    assert(await fund.olympusFee(), 0);
    try {
      await fund.setOlympusFee(olympusFee, { from: investorA });
      assert(false, 'User without permissions changed the fee. Expected revert tx');
    } catch (e) {
      assert(true);
    }
  })


  it("Owner retreives the invest fee with olympus fee discounted.", async () => {

    await fund.setOlympusFee(olympusFee, { from: coreAddress });

    // Some one invest 1 eht (free fee)
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    // Got fee 1%
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });

    // Fund manager get some benefits from investment
    const pendingFee = (await fund.getPendingManagmentFee()).toNumber();
    assert.equal(web3.toWei(1, 'ether') * (fundData.magementeFee / DENOMINATOR), pendingFee);

    // Withdraw the benefits,
    await fund.withdrawFee();
    const pendingFeeAfterWithdraw = (await fund.getPendingManagmentFee()).toNumber();
    const withdrawedFee = (await fund.getWithdrawedFee()).toNumber();
    // Check the withdraw fee has been reduced by the olympus fee
    assert.equal(0, pendingFeeAfterWithdraw)
    assert.equal(pendingFee * (1 - (olympusFee / DENOMINATOR)), withdrawedFee)
  })
})

contract("Fund Investment", (accounts) => {
  let fund;
  let core;
  let mockKyber;
  const adminAddress = accounts[0]; // Admin address have core permissions
  const coreAddress = accounts[1];
  const investorA = accounts[2];
  const investorB = accounts[3];


  before('Deploy Fund Managment', async () => log.catch(async () => {

    let permissionProvider = await PermissionProvider.deployed();
    let riskProvider = await RiskManagementProvider.deployed();
    // Exchange mockup
    mockKyber = await MockKyberNetwork.deployed();
    const priceProvider = await PriceProvider.deployed();
    await priceProvider.setKyber(mockKyber.address);
    core = await Core.deployed();

    // reserve
    const kyberExchange = await KyberNetworkExchange.deployed();
    const exchangeAdapterManager = await ExchangeAdapterManager.deployed();
    const exchangeProvider = await ExchangeProvider.deployed();
    await exchangeAdapterManager.addExchange("kyber", kyberExchange.address);
    await exchangeProvider.setCore(core.address);
    core.setProvider(2, exchangeProvider.address);

    permissionProvider.adminAdd(coreAddress, await permissionProvider.ROLE_CORE());
    permissionProvider.adminAdd(core.address, await permissionProvider.ROLE_CORE());

    fund = await FundTemplate.new(fundData.symbol, fundData.name, fundData.decimals);
    await fund.setPermissionProvider(permissionProvider.address);
    await fund.setPriceProvider(priceProvider.address);
    await fund.setRiskProvider(riskProvider.address);
    await fund.setCore(core.address);


    // Update the mock data with the mock kyber
    fundData.addresses = await mockKyber.supportedTokens();

    // Create the fund
    await fund.createFundDetails(fundData.id,
      fundData.name,
      fundData.description,
      fundData.category,
      0, // withdraw fee Cicle
      0, // Withdraw from fund
    );
    await fund.setOlympusFee(olympusFee, { from: coreAddress });

  }))

  it("Should be correctly configured", async () => log.catch(async () => {

    // Some one invest 1 eht
    const data = await fund.getFundDetails();
    assert.equal(data[0], adminAddress);
    assert.equal(data[1], fundData.name);
    assert.equal(data[2], fundData.symbol);
    assert.equal(data[3].toNumber(), 0, 'Total supply');
    assert.equal(data[4], fundData.description);
    assert.equal(data[5], fundData.category);
    assert.equal(data[6].length, 0);
    assert.equal(data[7].length, 0);


    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), 0); // Nothing invested yet
    assert.equal(widthdrawData[1].toNumber(), 0);  // No hours
    assert.notEqual(widthdrawData[2].toNumber(), 0); // Timer is now
    assert.equal(widthdrawData[3].length, 0, ' List of users that applied for withdraw must be empty');

  }))


  it("Should be able to invest and get balance of the found", async () => {

    // Some one invest 1 eht
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    const balance = (await fund.balanceOf(investorA)).toNumber();
    // When a fund is empty, his default value is 1ETH. We invest 1 ETH
    // That measn (1ETH  = 1 FUND)
    assert.equal(balance, toFundToken(2));

  })


  it("Should be able to request investment withdraw", async () => log.catch(async () => {

    // Some one invest 1 eht
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorB });
    const fundBalanceA = (await fund.balanceOf(investorA)).toNumber();
    const fundBalanceB = (await fund.balanceOf(investorB)).toNumber();

    assert.equal(fundBalanceA, toFundToken(2), ' Invested by A'); // From previus test
    assert.equal(fundBalanceB, toFundToken(2), 'Invested by B');

    await fund.withdrawRequest(toFundToken(0.5), { from: investorA });
    await fund.withdrawRequest(toFundToken(1), { from: investorB });

    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), web3.toWei(1.5, 'ether'), 'Total withdraw quantity');
    assert.equal(widthdrawData[3].length, 2, ' List of users that applied withdraw');
    assert.equal(widthdrawData[3][0], investorA, ' Investor A');
    assert.equal(widthdrawData[3][1], investorB, ' Investor B');

    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    const withdrawBalanceB = (await fund.withdrawBalanceOf(investorB)).toNumber();
    assert.equal(withdrawBalanceA, web3.toWei(0.5, 'ether'), ' Investor A withdraw balance');
    assert.equal(withdrawBalanceB, web3.toWei(1, 'ether'), ' Investor B withdraw balance');

  }))


  it("Should be able to withdraw with all ETH in balance", async () => log.catch(async () => {

    assert(
      (await web3.eth.getBalance(fund.address)).toNumber(), web3.toWei(4, 'ether'), 'Fund holds 4 eth when test starts'
    );

    const balanceA = (await web3.eth.getBalance(investorA)).toNumber();
    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    const balanceB = (await web3.eth.getBalance(investorB)).toNumber();
    const withdrawBalanceB = (await fund.withdrawBalanceOf(investorB)).toNumber();

    // Already invested in previus test

    await fund.withdraw();

    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), 0, 'Everything got withdraw');
    assert.equal(widthdrawData[3].length, 2, ' List of users that applied withdraw');
    assert.equal(widthdrawData[3][0], EMPTY_ADDRESS, ' Investor A');
    assert.equal(widthdrawData[3][1], EMPTY_ADDRESS, ' Investor B');

    assert.equal((await fund.withdrawBalanceOf(investorA)).toNumber(), 0, 'Investor A withdraw everything');
    assert.equal((await fund.withdrawBalanceOf(investorB)).toNumber(), 0, 'Investor B withdraw everything');

    const currentBalanceA = (await web3.eth.getBalance(investorA)).toNumber();
    const currentBalanceB = (await web3.eth.getBalance(investorB)).toNumber();

    assert(
      currentBalanceA - balanceA < withdrawBalanceA + OFFSET &&
      currentBalanceA - balanceA > withdrawBalanceA - OFFSET
      , 'Investor A Recover his ETH')
    assert(
      currentBalanceB - balanceB < withdrawBalanceB + OFFSET &&
      currentBalanceB - balanceB > withdrawBalanceB - OFFSET
      , 'Investor B Recover his ETH')

    assert.equal((await fund.getPrice())[0].toNumber(), web3.toWei(1, 'ether'), 'Price keep constant');
  }))



  it.skip("Should be able to withdraw with all ETH selling tokens", async () => log.catch(async () => {

    // Investor starts with 100, invest 2 ETH, get back 1.5 ETH in fund index
    // Invest 4 ETH
    await fund.sendTransaction({ value: web3.toWei(1.5, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(1.5, 'ether'), from: investorB });
    // Real invest is almost 3 (less little fee)
    const balanceA = (await web3.eth.getBalance(investorA)).toNumber();
    const balanceB = (await web3.eth.getBalance(investorB)).toNumber();

    await fund.withdrawRequest(toFundToken(1.5), { from: investorA });
    await fund.withdrawRequest(toFundToken(1.5), { from: investorB });
    const rates = [
      (await mockKyber.getExpectedRate(ETH, fundData.addresses[0], web3.toWei(2, 'ether')))[0].toNumber(),
      (await mockKyber.getExpectedRate(ETH, fundData.addresses[1], web3.toWei(2, 'ether')))[0].toNumber(),
    ];

    // Now the fund manager is gonna buy some tokens
    await core.fundBuyToken(
      "",
      fund.address,
      web3.toWei(3, 'ether'),
      fundData.addresses,
      [web3.toWei(1.5, 'ether'), web3.toWei(1.5, 'ether')],
      rates,
    );
    const [fundPrice, tokenPrice] = (await fund.getPrice()).map((price) => price.toNumber());
    assert.equal(fundPrice, web3.toWei(1, 'ether'), 'Fund price keeps constant');
    assert.equal(tokenPrice, web3.toWei(3, 'ether'), 'We got 3 ETH tokens in the total of tokens');

    const tokensBalance = [];
    // Check we have bought the tokens
    for (let i = 0; i < fundData.addresses.length; i++) {
      const erc20Token = await SimpleERC20Token.at(fundData.addresses[i]);
      const tokenBalance = (await erc20Token.balanceOf(fund.address)).toNumber();
      tokensBalance.push(tokenBalance); // To compare later
      assert.equal(tokenBalance, 1.5 * rates[i]);
    }

    const tx = await fund.withdraw();
    console.log(tx);
    const widthdrawData = await fund.getFundWithDrawDetails();

    assert.equal(widthdrawData[0].toNumber(), 0, 'Everything got withdraw');
    assert.equal(widthdrawData[3][0], EMPTY_ADDRESS, 'Array is Empty');
    assert.equal(widthdrawData[3][1], EMPTY_ADDRESS, 'Array is Empty');

    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    const withdrawBalanceB = (await fund.withdrawBalanceOf(investorB)).toNumber();

    assert.equal(withdrawBalanceA, 0, 'Investor A withdraw everything');
    assert.equal(withdrawBalanceB, 0, 'Investor B withdraw everything');

    const currentBalanceA = (await web3.eth.getBalance(investorA)).toNumber();
    const currentBalanceB = (await web3.eth.getBalance(investorB)).toNumber();

    assert(
      currentBalanceA - balanceA < web3.toWei(1.5, 'ether') + OFFSET &&
      currentBalanceA - balanceA > web3.toWei(1.5, 'ether') - OFFSET
      , 'Investor A Recover his ETH')
    assert(
      currentBalanceB - balanceB < web3.toWei(1.5, 'ether') + OFFSET &&
      currentBalanceB - balanceB > web3.toWei(1.5, 'ether') - OFFSET
      , 'Investor B Recover his ETH')
  }))



  it.skip("Token unlisted, user recives part in ETH part in token", async () => log.catch(async () => {

    // Investor starts with 100, invest 2 ETH, get back 1.5 ETH in fund index
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    // Real invest is 3.96 (0.02 was each fee)
    const balanceA = (await web3.eth.getBalance(investorA)).toNumber();

    await fund.withdrawRequest(toFundToken(1.5), { from: investorA });
    // Now the fund manager is gonna buy some tokens
    const rates = [
      (await mockKyber.getExpectedRate(ETH, fundData.addresses[0], web3.toWei(2, 'ether')))[0].toNumber(),
      (await mockKyber.getExpectedRate(ETH, fundData.addresses[1], web3.toWei(2, 'ether')))[0].toNumber(),
    ]
    await core.fundBuyToken(
      "",
      fund.address,
      web3.toWei(1, 'ether'),
      fundData.addresses,
      [web3.toWei(0.5, 'ether'), web3.toWei(0.5, 'ether')],
      rates,

    );

    // One token gets unlisted
    fund.tokenStatus(fundData.addresses[0], false);

    await fund.withdraw();

    fund.tokenStatus(fundData.addresses[0], true); // Reset

    // Check the rebalance function is updating correctly
    const dataAfter = await fund.getFundDetails();
    assert.equal(dataAfter[6].length, 2, 'Number of tokens is 2');
    assert(
      dataAfter[7][0].toNumber() < 10 ** 21 + OFFSET_TOKEN &&
      dataAfter[7][0].toNumber() > 10 ** 21 - OFFSET_TOKEN
      , 'Tokens are directly transfer to investor');

    assert(
      dataAfter[7][1].toNumber() < 10 ** 21 + OFFSET_TOKEN &&
      dataAfter[7][1].toNumber() > 10 ** 21 - OFFSET_TOKEN
      , 'Tokens are directly transfer to investor');


    // Check Balance of user
    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    assert.equal(withdrawBalanceA, 0, 'Investor A withdraw everything');
    const currentBalanceA = (await web3.eth.getBalance(investorA)).toNumber();

    assert(
      currentBalanceA - balanceA < web3.toWei(1.25, 'ether') + OFFSET &&
      currentBalanceA - balanceA > web3.toWei(1.25, 'ether') - OFFSET
      , 'Investor A Recover his ETH')

    // The unlisted token we get the amount in that token
    const erc20Token = await SimpleERC20Token.at(fundData.addresses[0]);
    const tokenBalance = (await erc20Token.balanceOf(investorA)).toNumber();
    const expectedToken = (web3.toWei(0.25, 'ether') * rates[0]) / web3.toWei(1, 'ether');

    assert(
      tokenBalance < expectedToken + OFFSET_TOKEN &&
      tokenBalance > expectedToken - OFFSET_TOKEN
      , 'Tokens are directly transfer to investor');


  }))

  it.skip("Withdraw shall execute only max transfers", async () => log.catch(async () => {

    await fund.setMaxWithdrawTransfers(1); // Withdraw one by one
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorB });

    await fund.withdrawRequest(toFundToken(1), { from: investorA });
    await fund.withdrawRequest(toFundToken(1), { from: investorB });

    // Only first users withdraw
    await fund.withdraw();

    assert.equal((await fund.getFundWithDrawDetails())[0].toNumber(),
      web3.toWei(1, 'ether'), ' Amount pending 1st round');

    // Second user withdraws
    await fund.withdraw();

    assert.equal((await fund.getFundWithDrawDetails())[0].toNumber(), 0, 'Second Amount pending');

    await fund.setMaxWithdrawTransfers(5); // Reset

  }))


})

