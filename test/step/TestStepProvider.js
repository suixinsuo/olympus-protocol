"use strict";

const StepProvider = artifacts.require("StepProvider");
const MockStepContract = artifacts.require("MockStepContract");
const Promise = require("bluebird");

contract("MockStepContract", accounts => {
  it("MockStepContract should be able to deploy.", async () => {
    return await Promise.all([
      MockStepContract.deployed(),
      StepProvider.deployed()
    ]).spread((mockStep, stepProvider) => {
      assert.ok(mockStep, "MockStepContract contract is not deployed.");
      assert.ok(stepProvider, "StepProvider contract is not deployed.");
    });
  });

  it("MockStepContract should be able to execute a complex function in steps until finished", async () => {
    let mockStepContract = await MockStepContract.deployed();
    let finished = false;
    while (finished == false) {
      finished = await mockStepContract.doMultipleSteps.call();
      await mockStepContract.doMultipleSteps();
    }
    assert.equal((await mockStepContract.someVariable.call()).toNumber(), 50);
    assert.equal((await mockStepContract.someOtherVariable.call()).toNumber(), 50);
    assert.equal(finished, true);
  });

  it("MockStepContract should be able to execute an easy function in steps until finished", async () => {
    let mockStepContract = await MockStepContract.deployed();
    let finished = false;
    while (finished == false) {
      finished = await mockStepContract.doEasySteps.call();
      await mockStepContract.doEasySteps();
    }
    assert.equal((await mockStepContract.someEasyVariable.call()).toNumber(), 50);
    assert.equal(finished, true);
  });
});
