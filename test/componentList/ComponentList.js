const log = require("../utils/log");
const ComponentList = artifacts.require("ComponentList");
const MockComponent = artifacts.require("MockComponent");

function bytes32ToString(bytes32) {
  return web3.toAscii(bytes32).replace(/\u0000/g, "");
}

contract("ComponetList", accounts => {
  let list;
  before("ComponentList Test", async () => {
    list = await ComponentList.new();
  });
  it("Set and Get ", async () => {
    const mockComponent = await MockComponent.new("New");
    await list.setComponent("reiumbrsable", mockComponent.address, { from: accounts[0] });
    const component = await list.getComponent("reiumbrsable", await mockComponent.version());
    assert.equal(component, mockComponent.address, "Checking the address is correct");
  });

  it("Override component", async () => {
    const olderMockComponent = await MockComponent.new("Older");
    const newMockComponent = await MockComponent.new("New");
    // set olderMockComponent's address into componentList contract.
    await list.setComponent("reiumbrsable", olderMockComponent.address, { from: accounts[0] });
    let component = await list.getComponent("reiumbrsable", await olderMockComponent.version());
    assert.equal(component, olderMockComponent.address, "Checking the address is correct");
    // Override the olderMockComponent's address
    await list.setComponent("reiumbrsable", newMockComponent.address, { from: accounts[0] });
    component = await list.getComponent("reiumbrsable", await newMockComponent.version());
    assert.equal(
      component,
      newMockComponent.address,
      "Override the component successfully: it is the same with newMockComponent"
    );
    assert.notEqual(
      component,
      olderMockComponent.address,
      "Override the component successfully: olderMockComponent is different with the address from component list"
    );
  });

  it("update version", async () => {
    const mockComponentV1 = await MockComponent.new("V1");
    const mockComponentV2 = await MockComponent.new("V2");
    // set olderMockComponent's address into componentList contract.
    await list.setComponent("reiumbrsable", mockComponentV1.address, { from: accounts[0] });
    await list.setComponent("reiumbrsable", mockComponentV2.address, { from: accounts[0] });
    //mockComponentV1
    let component = await list.getComponent("reiumbrsable", await mockComponentV1.version());
    assert.equal(component, mockComponentV1.address, "mockComponentV1's address is correct");
    //mockComponentV2
    component = await list.getComponent("reiumbrsable", await mockComponentV2.version());
    assert.equal(component, mockComponentV2.address, "mockComponentV2's address is correct");
  });

  it("permission check", async () => {
    const mockComponentV1 = await MockComponent.new("V1");
    const mockComponentV2 = await MockComponent.new("V2");
    // set olderMockComponent's address into componentList contract.
    await list.setComponent("reiumbrsable", mockComponentV1.address, { from: accounts[0] });

    try {
      await list.setComponent("reiumbrsable", mockComponentV2.address, { from: accounts[1] });
      assert(false, "should revert");
    } catch (e) {
      if (e.message.includes("revert")) {
        assert(true, "Non-owner can't call it.");
      } else {
        assert(false, "should revert");
        throw e;
      }
    }
  });

  it("get latest version", async () => {
    const mockComponentV1 = await MockComponent.new("V1");
    const mockComponentV2 = await MockComponent.new("V2");

    list = await ComponentList.new();

    // set olderMockComponent's address into componentList contract.
    await list.setComponent("reiumbrsable", mockComponentV1.address, { from: accounts[0] });
    let component = await list.getLatestComponent("reiumbrsable");
    let versions = (await list.getComponentVersions("reiumbrsable")).map(bytes32ToString);
    assert.deepEqual(versions, ["V1"]);
    assert.equal(
      await MockComponent.at(component).version(),
      await mockComponentV1.version(),
      "version 1 should be the same"
    );

    await list.setComponent("reiumbrsable", mockComponentV2.address, { from: accounts[0] });
    versions = (await list.getComponentVersions("reiumbrsable")).map(bytes32ToString);
    assert.deepEqual(versions, ["V1", "V2"]);
    component = await list.getLatestComponent("reiumbrsable");
    assert.equal(
      await MockComponent.at(component).version(),
      await mockComponentV2.version(),
      "version 2 should be the same"
    );

    await list.setComponent("reiumbrsable", mockComponentV1.address, { from: accounts[0] });
    component = await list.getLatestComponent("reiumbrsable");
    assert.equal(
      await MockComponent.at(component).version(),
      await mockComponentV1.version(),
      "should take the lastest version"
    );
    versions = (await list.getComponentVersions("reiumbrsable")).map(bytes32ToString);
    assert.deepEqual(versions, ["V2", "V1"]);
  });
});
