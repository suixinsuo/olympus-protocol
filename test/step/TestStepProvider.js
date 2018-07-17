"use strict";

const StepProvider = artifacts.require("StepProvider");
const MockStepContract = artifacts.require("MockStepContract");
const Promise = require("bluebird");

contract("MockStepContract", accounts => {
  let mockStepContract;
  let stepProvider;
  it("MockStepContract should be able to deploy.", async () => {
    stepProvider = await StepProvider.deployed();
    assert.ok(stepProvider, "StepProvider contract is not deployed.");
    mockStepContract = await MockStepContract.new(stepProvider.address);
  });

  it("MockStepContract should be able to execute a complex function in steps until finished", async () => {
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
    let finished = false;
    while (finished == false) {
      finished = await mockStepContract.doEasySteps.call();
      await mockStepContract.doEasySteps();
    }
    assert.equal((await mockStepContract.someEasyVariable.call()).toNumber(), 50);
    assert.equal(finished, true);
  });
});
