
'use strict';
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const RiskManagementProvider = artifacts.require("../contracts/riskManagement/RiskManagementProvider.sol");
const PriceProvider = artifacts.require("../contracts/price/PriceProvider.sol");


const FundTemplate = artifacts.require("FundTemplate");

const fundData = {
  id: 1,
  name: 'Test',
  symbol: 'TEST',
  description: 'Is a fund for test',
  decimals: 18,
  category: 'testing',
  // EOS,  Mana
  address: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  weights: [50, 50]
}

contract.only("Fund Managment", (accounts) => {
  let fund;
  const adminAddress = accounts[1]; // Admin address have core permissions
  const coreAddress = accounts[1];
  const otherAddress = accounts[2];

  before('Deploy Fund Managment', async () => {
    let permissionProvider = await PermissionProvider.deployed();
    let riskProvider = await RiskManagementProvider.deployed();
    let priceProvider = await PriceProvider.deployed();
    permissionProvider.adminAdd(coreAddress, await permissionProvider.ROLE_CORE());
    fund = await FundTemplate.new(fundData.symbol, fundData.name, fundData.decimals);
    fund.setPermissionProvider(permissionProvider.address);
    fund.setPriceProvider(priceProvider.address);
    fund.setRiskProvider(riskProvider.address);

  })

  it("Should be able to change the core fee.", async () => {
    assert(await fund.olympusFee(), 0);
    await fund.setOlympusFee(30, { from: coreAddress });
    assert(await fund.olympusFee(), 30);

  })

  it("Should be reject change fee without permissions.", async () => {
    assert(await fund.olympusFee(), 0);
    try {
      await fund.setOlympusFee(30, { from: accounts[2] });
      assert(false, 'User without permissions changed the fee. Expected revert tx');
    } catch (e) {
      assert(true);
    }
  })

  it.only("Should be able to invest.", async () => {

    await fund.setOlympusFee(30, { from: coreAddress });

    // Create the fund
    await fund.createFundDetails(fundData.id,
      fundData.name,
      fundData.description,
      fundData.category,
      fundData.address,
      fundData.weights,
      0, // withdraw Cicle
    );
    // Some one invest 1 eht
    await fund.send(web3.toWei(1, 'ether'), { from: adminAddress });

    const investedBalance = await fund.balanceOf(adminAddress);
    const pendingFee = await fund.getPendingManagmentFee();
    // await fund.withdrawFee();
    console.log(otherAddress);
    console.log(investedBalance.toNumber());
    console.log(pendingFee.toNumber());
  })

})

