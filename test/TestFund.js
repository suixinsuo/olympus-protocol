
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


const FundTemplate = artifacts.require("FundTemplate");
const DENOMINATOR = 10000;
const olympusFee = 300; // Denominator is 10.000, so 3%
const ETH = 0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

const fundData = {
  id: 1,
  name: 'Test',
  symbol: 'TEST',
  description: 'Is a fund for test',
  decimals: 18,
  category: 'testing',
  // EOS,  Mana
  address: [], // Initialized from  mockup provider
  weights: [],
  magementeFee: 1, // 1%, fixed in the contract
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
    permissionProvider.adminAdd(coreAddress, await permissionProvider.ROLE_CORE());
    fund = await FundTemplate.new(fundData.symbol, fundData.name, fundData.decimals);
    await fund.setPermissionProvider(permissionProvider.address);
    await fund.setPriceProvider(priceProvider.address);
    await fund.setRiskProvider(riskProvider.address);

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
})

contract("Fund Investment", (accounts) => {
  let fund;
  let core;
  let mockKyber;
  const adminAddress = accounts[0]; // Admin address have core permissions
  const coreAddress = accounts[1];
  const investorA = accounts[2];
  const investorB = accounts[3];

  before('Deploy Fund Managment', async () => {
    try {
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
      // // Send some ether to reserve
      // await kyberExchange.send(web3.toWei(mockData.tokensLenght, 'ether'));


      permissionProvider.adminAdd(coreAddress, await permissionProvider.ROLE_CORE());
      fund = await FundTemplate.new(fundData.symbol, fundData.name, fundData.decimals);
      await fund.setPermissionProvider(permissionProvider.address);
      await fund.setPriceProvider(priceProvider.address);
      await fund.setRiskProvider(riskProvider.address);
      await fund.setCore(core.address);


      // Update the mock data with the mock kyber
      fundData.addresses = await mockKyber.supportedTokens();
      // 2 tokens, 50% each
      fundData.weights = fundData.addresses.map(() =>
        Math.floor(100 / fundData.addresses.length)
      );

      // Create the fund
      await fund.createFundDetails(fundData.id,
        fundData.name,
        fundData.description,
        fundData.category,
        fundData.address,
        fundData.weights,
        0, // withdraw fee Cicle
        0, // Withdraw from fund
      );
      await fund.setOlympusFee(olympusFee, { from: coreAddress });
    } catch (e) {
      console.error('Error on Before Deployment Fund');
      console.log(e);
    }
  })

  it("Should be correctly configured", async () => {

    // Some one invest 1 eht
    const data = await fund.getFundDetails();
    assert.equal(data[0], adminAddress);
    assert.equal(data[1], fundData.name);
    assert.equal(data[2], fundData.symbol);
    assert.equal(data[3].toNumber(), 0, 'Total supply');
    assert.equal(data[4], fundData.description);
    assert.equal(data[5], fundData.category);
    assert.equal(data[6][0], fundData.address[0]);
    assert.equal(data[6][1], fundData.address[1]);
    assert.equal(data[7][0].toNumber(), fundData.weights[0]);
    assert.equal(data[7][1].toNumber(), fundData.weights[1]);

    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), 0); // Nothing invested yet
    assert.equal(widthdrawData[1].toNumber(), 0);  // No hours
    assert.notEqual(widthdrawData[2].toNumber(), 0); // Timer is now
    assert.equal(widthdrawData[3].length, 0, ' List of users that applied withdrawe');
  })


  it("Should be able to invest and get balance of the found", async () => {

    // Some one invest 1 eht
    await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    const balance = (await fund.balanceOf(investorA)).toNumber();
    // When a fund is empty, his default value is 0.1 eth. We invest 1 ETH (0.9) after fee.
    // That measn that we shall have 90% of the fund
    assert.equal(balance, 9 * (10 ** 18));
  })

  it("Owner retreives the invest fee with olympus fee discounted.", async () => {
    // Some one invest 1 eht
    const tx = await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: investorA });
    // Fund manager get some benefits from investment
    const pendingFee = (await fund.getPendingManagmentFee()).toNumber();
    assert.equal(web3.toWei(1, 'ether') * (fundData.magementeFee / 100), pendingFee);
    log.events(tx);

    // Withdraw the benefits,
    await fund.withdrawFee();
    const pendingFeeAfterWithdraw = (await fund.getPendingManagmentFee()).toNumber();
    const withdrawedFee = (await fund.getWithdrawedFee()).toNumber();
    // Check the withdraw fee has been reduced by the olympus fee
    assert.equal(0, pendingFeeAfterWithdraw)
    assert.equal(pendingFee * (1 - (olympusFee / DENOMINATOR)), withdrawedFee)
  })

  it("Should be able to request investment withdraw", async () => log.catch(async () => {
    // Some one invest 1 eht
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorB });
    const balanceA = (await fund.balanceOf(investorA)).toNumber();
    const balanceB = (await fund.balanceOf(investorB)).toNumber();

    // When a fund is empty, his default value is 0.1 eth. We invest 1 ETH (0.9) after fee.
    // That measn that we shall have 90% of the fund
    assert.equal(balanceA, 19 * (10 ** 18), ' Invested by A');
    assert.equal(balanceB, 19 * (10 ** 18), 'Invested by B');

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

  it("Should be able to request investment withdraw", async () => log.catch(async () => {
    // Investors invest eht
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorB });
    const balanceA = (await fund.balanceOf(investorA)).toNumber();
    const balanceB = (await fund.balanceOf(investorB)).toNumber();

    // Because the FUND only has ETH, the share keeps at 1ETH=1FUND
    // We get same amount of FUND as ETH invested (less the 1% fee)
    assert.equal(balanceA, 1.98 * (10 ** 18), ' Invested by A');
    assert.equal(balanceB, 1.98 * (10 ** 18), 'Invested by B');
    // We are not requesting to withdraw ETH, but FUND Token
    await fund.withdrawRequest(toFundToken(0.5), { from: investorA });
    await fund.withdrawRequest(toFundToken(1), { from: investorB });

    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), web3.toWei(1.5, 'ether'), 'Total withdraw quantity');
    assert.equal(widthdrawData[3].length, 2, ' List of users that applied withdraw');
    assert.equal(widthdrawData[3][0], investorA, ' Investor A');
    assert.equal(widthdrawData[3][1], investorB, ' Investor B');

    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    const withdrawBalanceB = (await fund.withdrawBalanceOf(investorB)).toNumber();
    assert.equal(withdrawBalanceA, toFundToken(0.5), ' Investor A withdraw balance');
    assert.equal(withdrawBalanceB, toFundToken(1), ' Investor B withdraw balance');

  }))

  it("Should be able to withdraw with all ETH in balance", async () => log.catch(async () => {

    // Invest 4 ETH
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorA });
    await fund.sendTransaction({ value: web3.toWei(2, 'ether'), from: investorB });
    // Real invest is 3.96 (0.02 was each fee)
    await fund.withdrawRequest(toFundToken(0.5), { from: investorA });
    await fund.withdrawRequest(toFundToken(1), { from: investorB });

    await fund.withdraw();

    const widthdrawData = await fund.getFundWithDrawDetails();
    assert.equal(widthdrawData[0].toNumber(), 0, 'Everything got withdraw');
    assert.equal(widthdrawData[3].length, 0, 'Array is Empty');

    const withdrawBalanceA = (await fund.withdrawBalanceOf(investorA)).toNumber();
    const withdrawBalanceB = (await fund.withdrawBalanceOf(investorB)).toNumber();
    assert.equal(withdrawBalanceA, 0, 'Investor A withdraw everything');
    assert.equal(withdrawBalanceB, 0, 'Investor B withdraw everything');
  }))


})

