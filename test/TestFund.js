
'use strict';
const PermissionProvider = artifacts.require("../contracts/permission/PermissionProvider.sol");
const RiskManagementProvider = artifacts.require("../contracts/riskManagement/RiskManagementProvider.sol");
const PriceProvider = artifacts.require("../contracts/price/PriceProvider.sol");


const FundTemplate = artifacts.require("FundTemplate");
const DENOMINATOR = 10000;
const fundData = {
  id: 1,
  name: 'Test',
  symbol: 'TEST',
  description: 'Is a fund for test',
  decimals: 18,
  category: 'testing',
  // EOS,  Mana
  address: ["0xEa1887835D177Ba8052e5461a269f42F9d77A5Af", "0x569b92514E4Ea12413dF6e02e1639976940cDe70"],
  weights: [50, 50],
  magementeFee: 1, // 1%, fixed in the contract
}

contract("Fund Managment", (accounts) => {
  let fund;
  const adminAddress = accounts[0]; // Admin address have core permissions
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

  it("Owner retreives the invest fee with olympus fee discounted.", async () => {
    const olympusFee = 300; // Denominator is 10.000, so 3%
    await fund.setOlympusFee(olympusFee, { from: coreAddress });

    // Create the fund
    await fund.createFundDetails(fundData.id,
      fundData.name,
      fundData.description,
      fundData.category,
      fundData.address,
      fundData.weights,
      0 // withdraw Cicle
    );
    // Some one invest 1 eht
    await fund.send(web3.toWei(1, 'ether'), { from: otherAddress });
    // Fund manager get some benefits from investment
    const pendingFee = (await fund.getPendingManagmentFee()).toNumber();
    assert.equal(web3.toWei(1, 'ether') * (fundData.magementeFee / 100), pendingFee);

    // Withdraw the benefits,
    await fund.withdrawFee();
    const pendingFeeAfterWithdraw = (await fund.getPendingManagmentFee()).toNumber();
    const withdrawedFee = (await fund.getWithdrawedFee()).toNumber();
    // Check the withdraw fee has been reduced by the olympus fee
    assert.equal(0, pendingFeeAfterWithdraw)
    assert.equal(pendingFee * (1 - (olympusFee / DENOMINATOR)), withdrawedFee)

  })


  // it("Should be able to invest and get balance of the found", async () => {
  //   const olympusFee = 300; // Denominator is 10.000, so 3%
  //   await fund.setOlympusFee(olympusFee, { from: coreAddress });

  //   // Create the fund
  //   await fund.createFundDetails(fundData.id,
  //     fundData.name,
  //     fundData.description,
  //     fundData.category,
  //     fundData.address,
  //     fundData.weights,
  //     0, // withdraw Cicle
  //   );
  //   // Some one invest 1 eht
  //   const tx = await fund.sendTransaction({ value: web3.toWei(1, 'ether'), from: otherAddress });
  //   const balance = (await fund.balanceOf(otherAddress)).toNumber();
  //   // When a fund is empty, his default value is 0.1 eth. We invest 1 ETH (0.9) after fee.
  //   // That measn that we shall have 90% of the fund
  //   console.log(JSON.stringify(tx.logs, null, 2), balance);
  //   assert.equal(balance, 9 * (10 ** 18));
  // })

})

