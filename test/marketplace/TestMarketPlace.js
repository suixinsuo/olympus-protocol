const log = require("../utils/log");
const MockMarketClient = artifacts.require("MockMarketClient");
const MarketplaceProvider = artifacts.require("../../contracts/Marketplace.sol");

contract("Marketplace", accounts => {
  let marketplace;

  before("Run marketplace", async () => {
    marketplace = await MarketplaceProvider.deployed();
  });

  it("Marketplace returns registered products", async () => {
    const product1 = await MockMarketClient.new();
    await product1.register(marketplace.address);
    const product2 = await MockMarketClient.new();
    await product2.register(marketplace.address);
    const product3 = await MockMarketClient.new({ from: accounts[1] });
    await product3.register(marketplace.address, { from: accounts[1] });

    assert.equal(await product1.getComponentByName(await product1.MARKET()), marketplace.address);

    const myProducts = await marketplace.getOwnProducts();

    assert.equal(myProducts.length, 2, "Account 0 has 2 produts");
    assert.equal(myProducts[0], product1.address);
    assert.equal(myProducts[1], product2.address);

    const allProducts = await marketplace.getAllProducts();
    assert.equal(allProducts.length, 3, "All are 3 produts");
  });

  it("Marketplace avoid duplicated registration", async () => {
    const product1 = await MockMarketClient.new();
    const tx1 = await product1.register(marketplace.address);
    assert.equal(parseInt(tx1.receipt.status, 16), 1);
    try {
      await product1.register(marketplace.address);
      assert(false, "Must revert");
    } catch (e) {
      assert(true);
    }
  });
});
