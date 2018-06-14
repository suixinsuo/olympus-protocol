
const DummyDerivative = artifacts.require("DummyDerivative");
const MarketplaceProvider = artifacts.require("../../contracts/Marketplace.sol");



contract('MarketPlace', (accounts) => {
  let marketplace;
  before('Run marketplace', async () => {
    marketplace = await MarketplaceProvider.deployed();
  })

  it("Marketplace returns registered products", async () => {
    const product1 = await DummyDerivative.new(marketplace.address);
    const product2 = await DummyDerivative.new(marketplace.address);
    await DummyDerivative.new(marketplace.address, { from: accounts[1] });

    const myProducts = await marketplace.getOwnProducts();

    assert.equal(myProducts.length, 2, 'Account 0 has 2 produts');
    assert.equal(myProducts[0], product1.address);
    assert.equal(myProducts[1], product2.address);

    const allProducts = marketplace.products();

    assert.equal(allProducts.length, 3, 'All are 3 produts');
  })

  it("Marketplace avoid duplicated registration", async () => {
    const product1 = await DummyDerivative.new(marketplace.address);
    const tx = await product1.register(marketplace.address);
    assert(true);
  })
});
