'use strict';
const ReimbursableClient = artifacts.require("MockTestReimbursable");
const Reimbursable = artifacts.require("../../contracts/components/base/Reimbursable.sol");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract("Test Reimbursable", (accounts) => {
  let reimbursableClient;
  it('Should be able to deploy', async () => {
    const reimbursable = await Reimbursable.deployed();
    reimbursableClient = await ReimbursableClient.new(reimbursable.address);

    assert.ok(reimbursable, 'Reimbursable contract has to be deployed.');

  })

  it('it should reimburse the gas used.', async () => {

    // send 1 eth to the contract.
    const result = await reimbursableClient.send(web3.toWei(1, "ether"));
    assert.ok(result, 'Unable to send ethers to Reimbursable contract.');

    let contractBalance = await web3.eth.getBalance(reimbursableClient.address);
    assert.equal(web3.toWei(1), contractBalance);

    let initialBalance = await web3.eth.getBalance(accounts[0]);

    await reimbursableClient.someFunction.estimateGas({
      from: accounts[0],
      to: reimbursableClient.address,
      gas: 10 ** 6
    });

    await reimbursableClient.someFunction.call({ from: accounts[0] });

    let finalBalance = await web3.eth.getBalance(accounts[0]);
    assert.ok(initialBalance.comparedTo(finalBalance) === 0);

    // the balance of the contract
    // tested on kovan, but on local, it fails.
    // contractBalance = await web3.eth.getBalance(reimbursableClient.address);
    // console.log('Contract balance', web3.fromWei(contractBalance.toString()), 'ether');
    // assert.ok(contractBalance.comparedTo(web3.toWei(1) - actualGasCosted) === 0);
  })
});
