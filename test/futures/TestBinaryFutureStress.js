const calc = require('../utils/calc');
const BigNumber = web3.BigNumber;

const {
  FutureDirection
} = require('../utils/constants');
const futureUtils = require('./futureUtils');
const utils = require('./futureBinaryUtils');
const BinaryFuture = artifacts.require('BinaryFutureStub');
const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');

contract('Test Binary Future Stress', accounts => {

  let providers;
  let binaryFuture;

  before('Initialize ComponentList', async () => {
    assert(accounts.length >= 21, "Require at least 11 investors for this test case");
    providers = await futureUtils.setUpComponentList();
  });

  /** Invest with different prices
   Make sure 11 accounts are available. Account 0 is the deployment account, account 1-10 are test accounts.

   1. Using account 0 , call setMockTargetPrice and set value to 1 ether (10**18)
      expect getTargetPrice should return 10**18
   2. Using account 0, call setMockPeriod and set the value to 2
      expect getCurrentPeriod should return 2
   3. Using accounts 1-5 invest into short position (5 transactions)
      account 1: invest (1,2) (with value of 0.2* 10**18)
      account 2: invest (1,2) (with value of 0.05* 10**18)
      account 3: invest (1,2) (with value of 0.35* 10**18)
      account 4: invest (1,2) (with value of 0.1* 10**18)
      setMockTargetPrice(0.5*10**18) (in between, call this function)
      account 5: invest (1,2) (with value of 0.5* 10**18)
      expect 5 new short tokens are created, check the balance of each of those tokens to equal our investment
   4. Using accounts 6-10 invest into long position (5 transactions)
      account 6: invest (-1,2) (with value of 0.1* 10**18)
      account 7: invest (-1,2) (with value of 0.025* 10**18)
      account 8: invest (-1,2) (with value of 0.075* 10**18)
      account 9: invest (-1,2) (with value of 0.25* 10**18)
      setMockTargetPrice(1.2*10**18) (in between, call this function)
      account 10: invest (-1,2) (with value of 0.05* 10**18)
      expect 5 new long tokens are created, check the balance of each of those tokens to equal our investment.
      There should now be 1 ETH investment into short, and 0.5 ETH investment into long, total.
  */
  it("1. Invest with different prices ", async () => {
    const {
      future,
      longToken,
      shortToken,
    } = await utils.createDefaultBinaryFuture(providers.componentList, providers.mockMOT.address);
    binaryFuture = {
      future,
      longToken,
      shortToken,
    };
    assert.equal((await future.status()).toNumber(), 1); // new
    // Using account 0 , call setMockTargetPrice and set value to 1 ether (10**18)
    const price = web3.toWei(1, 'ether');
    await future.setMockTargetPrice(price);
    const targetPrice = await future.getTargetPrice();
    assert.equal(+targetPrice, price, 'targetPrice should equal set');
    const period = 2;
    await future.setMockPeriod(period);
    const currentPeriod = await future.getCurrentPeriod();
    assert.equal(+currentPeriod, period, 'currentPeriod should equal set');

    const shortValues = [
      0.2 * 10 ** 18,
      0.05 * 10 ** 18,
      0.35 * 10 ** 18,
      0.1 * 10 ** 18,
    ];

    await Promise.all(shortValues.map(async (value, index) => {
      await future.invest(FutureDirection.Short, period, {
        from: accounts[index + 1],
        value
      });
    }));
    await future.setMockTargetPrice(0.5 * 10 ** 18);
    shortValues.push(0.5 * 10 ** 18);
    await future.invest(FutureDirection.Short, period, {
      from: accounts[5],
      value: shortValues[4],
    });


    const shortTokenIds = await future.getTokensByPeriod(FutureDirection.Short, period);
    shortTokenIds.map(async (id) => {
      const value = await shortToken.getDeposit(id);
      const exist = shortValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    });

    assert.equal(shortTokenIds.length, 5, 'should have 5 short tokens');

    // 4. Using accounts 6-10 invest into long position (5 transactions)
    // account 6: invest (-1,2) (with value of 0.1* 10**18)
    // account 7: invest (-1,2) (with value of 0.025* 10**18)
    // account 8: invest (-1,2) (with value of 0.075* 10**18)
    // account 9: invest (-1,2) (with value of 0.25* 10**18)
    // setMockTargetPrice(1.2*10**18) (in between, call this function)
    // account 10: invest (-1,2) (with value of 0.05* 10**18)
    // expect 5 new long tokens are created, check the balance of each of those tokens to equal our investment.
    // There should now be 1 ETH investment into short, and 0.5 ETH investment into long, total.

    const longValues = [
      0.1 * 10 ** 18,
      0.025 * 10 ** 18,
      0.075 * 10 ** 18,
      0.25 * 10 ** 18,
    ];

    await Promise.all(longValues.map(async (value, index) => {
      await future.invest(FutureDirection.Long, period, {
        from: accounts[index + 6],
        value
      });
    }));

    await future.setMockTargetPrice(1.2 * 10 ** 18);
    longValues.push(0.5 * 10 ** 18);
    await future.invest(FutureDirection.Long, period, {
      from: accounts[10],
      value: longValues[4],
    });

    const longTokenIds = await future.getTokensByPeriod(FutureDirection.Long, period);
    longTokenIds.map(async (id) => {
      const value = await longToken.getDeposit(id);
      const exist = longValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    });
    assert.equal(longTokenIds.length, 5, 'should have 5 long tokens');


    //  1. Using account 0 , call setMockTargetPrice and set value to 1.5 ether (1.5*10**18)
    //   expect getTargetPrice should return 1.5*10**18
    //  2. Using account 0, call setMockPeriod and set the value to 4
    //   expect getCurrentPeriod should return 4
    await future.setMockTargetPrice(1.5 * 10 ** 18);
    await future.setMockPeriod(4);
    //  3. Get the balance in the future of accounts 1-5 (their investment amount) and add this together. The resulting value is LOST_ETHER
    // expect LOST_ETHER(need calculate)
    const allShortValues = shortValues.reduce((a, b) => new BigNumber(a).plus(b));
    const allLongValues = longValues.reduce((a, b) => new BigNumber(a).plus(b));
    //  5. Get balances of accounts 2-10. The resulting value is NON_CLEAR_ACCOUNT_BALANCES
    //   expect NON_CLEAR_ACCOUNT_BALANCES is set
    //  6. Use account 1, call clear(2)
    //   expect  1). The CLEAR_REWARD direct sent to account1.
    //           2). add userRedeemBalance of accounts 6 through 10 together, this should be equal to LOST_ETHER - CLEAR_REWARD
    //           3). Check balances of account 2-10, compare with NON_CLEAR_ACCOUNT_BALANCES to verify that no balance changed(only check event to see)
    const account_1 = accounts[1];
    const clearTx = await future.clear(period, {
      from: account_1
    });

    const clearRewardValue = utils.getClearRewardFromLogEvent(clearTx);
    const account2_10 = accounts.slice(2, 11);
    const userRedeemBalances = await Promise.all(account2_10.map(
      async (account) => await future.userRedeemBalance(account)));
    const totalOfUserRedeemBalance = userRedeemBalances.reduce((a, b) => a.plus(b));
    // const winnersBalance = await future.winnersBalances(period);
    // console.log('winnersBalance:', +winnersBalance, allShortValues);

    // use event logs check the actually reward;
    // verify clear reward
    const clearReward = await utils.estimateRewardAmountForBinaryFuture(future, allShortValues);
    assert.equal(+clearRewardValue, +clearReward, 'reward should be expected');
    assert(allShortValues.plus(allLongValues).minus(clearReward).eq(totalOfUserRedeemBalance),
      'totalOfUserRedeemBalance should be equal LOST_ETHER + allLongValue - CLEAR_REWARD ');

    let index = 7;
    while (index < 11) {
      const oldBalance = web3.eth.getBalance(accounts[index]);
      const redeemBalance = await future.userRedeemBalance(accounts[index]);
      const investValue = longValues[index - 6];
      // console.log('investValue:', investValue);
      const percentage = new BigNumber(investValue).div(allLongValues);
      const shouldRedeem = allShortValues.minus(clearReward).times(percentage).plus(investValue);
      // string value for big number will not equal should compare with number;
      // console.log('shouldRedeem', +percentage, shouldRedeem.toString(), redeemBalance.toString());
      assert.equal(+shouldRedeem, +redeemBalance, 'expected redeem balance');
      await future.redeem({
        from: accounts[index]
      });
      const balance = web3.eth.getBalance(accounts[index]);
      // console.log('Redeem:', +balance.minus(oldBalance), +redeemBalance);
      assert(calc.inRange(+balance.minus(oldBalance), +redeemBalance, 10 ** 15),
        'expected redeemed balance near redeemBalance');
      index++;
    }

  });

  it("2. Invest clear but without price changed. ", async () => {
    const {
      future
    } = binaryFuture;
    // Using account 0, call setMockPeriod and set the value to 5
    await future.setMockPeriod(5);
    let period = await future.getCurrentPeriod();
    assert.equal(+period, 5, 'getCurrentPeriod should be 5');

    // Using account 6, invest in the long position invest(-1,5) with 1 Ether
    const value = 1 * 10 ** 18;

    let index = 1;
    while (index <= 5) {
      await future.invest(FutureDirection.Long, 5, {
        from: accounts[index],
        value
      });
      index++;
    }

    // Using account 0 call setMockPeriod and set the value to 7
    await future.setMockPeriod(7);
    period = await future.getCurrentPeriod();
    assert.equal(+period, 7, 'getCurrentPeriod should be 7');

    const balance = await web3.eth.getBalance(accounts[1]);
    const clearTx = await future.clear(5, {
      from: accounts[1]
    });
    const rewardValue = utils.getClearRewardFromLogEvent(clearTx);
    assert(rewardValue === 0, 'reward should be nothing');
    const clearedBalance = await web3.eth.getBalance(accounts[1]);
    const actualGetReward = clearedBalance.minus(balance);
    assert.isBelow(+actualGetReward, 0, 'reward should be 0');
    index = 1;
    while (index <= 5) {
      const redeem = await future.userRedeemBalance(accounts[index]);
      assert.equal(+redeem, value, 'userRedeemBalance equal they invested');
      index++;
    }

  });

  it("3. Invest long only, price changed but nobody win.", async () => {
    const {
      future
    } = binaryFuture;

    // Using account 0 , call setMockTargetPrice and set value to 1 ether (10**18)
    await future.setMockTargetPrice(1 * 10 ** 18);
    let targetPrice = await future.getTargetPrice();
    assert.equal(+targetPrice, 1 * 10 ** 18, 'call getTargetPrice, should return 10**18');
    // Using account 6, invest 1 ETH in period 7 (current period). invest(-1, 7)
    const a6InvestValue = 10 ** 18;
    await future.invest(FutureDirection.Long, 7, {
      from: accounts[6],
      value: a6InvestValue
    });
    const a1InvestValue = 0.02 * 10 ** 18;
    await future.invest(FutureDirection.Long, 7, {
      from: accounts[1],
      value: a1InvestValue
    });

    // Using account 0, call setMockPeriod and set to 9
    await future.setMockPeriod(9);
    let period = await future.getCurrentPeriod();
    assert.equal(+period, 9, 'getCurrentPeriod should be 9');
    // Using account 0 , call setMockTargetPrice and set value to 0.5 ether (0.5*10**18)
    await future.setMockTargetPrice(0.5 * 10 ** 18);
    targetPrice = await future.getTargetPrice();
    assert.equal(+targetPrice, 0.5 * 10 ** 18, 'call getTargetPrice, should return 0.5 * 10 ** 18');

    const redeemOfA6 = await future.userRedeemBalance(accounts[6]);
    const redeemOfA1 = await future.userRedeemBalance(accounts[1]);
    // Using account 1, call clear(7)
    const clearTx = await future.clear(7, {
      from: accounts[1]
    });

    const redeemOfA6AfterClear = await future.userRedeemBalance(accounts[6]);
    const redeemOfA1AfterClear = await future.userRedeemBalance(accounts[1]);
    const clearReward = utils.getClearRewardFromLogEvent(clearTx);
    assert.equal(clearReward, 0, 'clearReward should be 0');
    assert(redeemOfA6.plus(a6InvestValue).eq(redeemOfA6AfterClear),
      'userRedeemBalance of account 6 should not be changed');
    assert(redeemOfA1.plus(a1InvestValue).eq(redeemOfA1AfterClear),
      'userRedeemBalance of account 1 should not be changed');

  });

  it("4. Invest again and lose while having winners", async () => {
    const {
      future
    } = binaryFuture;
    // Using account 0 , call setMockTargetPrice and set value to 1 ether (10**18)
    await future.setMockTargetPrice(1 * 10 ** 18);
    // Using account 6, invest 1 ETH in the long direction. invest(-1,9)
    await future.invest(FutureDirection.Long, 9, {
      from: accounts[6],
      value: 10 ** 18
    });
    // Using account 7, invest 1 ETH in the short direction. invest(1,9)
    await future.invest(FutureDirection.Short, 9, {
      from: accounts[7],
      value: 10 ** 18
    });

    await future.invest(FutureDirection.Short, 9, {
      from: accounts[1],
      value: 10 ** 18
    });

    // Using account 0, call setMockPeriod and set to 11
    await future.setMockPeriod(11);
    // Using account 0, call setMockTargetPrice and set value to 0.9 ether (0.9*10**18)
    await future.setMockTargetPrice(0.9 * 10 ** 18);
    // Using account 1, call clear(9)

    const redeemOfA6Before = await future.userRedeemBalance(accounts[6]);

    const clearTx = await future.clear(9, {
      from: accounts[1]
    });

    // Using the same way as the last case, check that account 1 has been reimbursed and save this variable in CLEAR_REWARD_FOUR
    const clearReward = utils.getClearRewardFromLogEvent(clearTx);
    const estimateReward = await utils.estimateRewardAmountForBinaryFuture(future, new BigNumber(10 ** 18));
    assert(clearReward.eq(estimateReward), 'clearReward should equal estimated');

    // Check that userRedeemBalance of account 6 is still ((1 ETH - CLEAR_REWARD_THREE) + (1 ETH - CLEAR_REWARD_TWO) + (0.2 ETH - CLEAR_REWARD/5))
    // Check that userRedeemBalance of account 7 is 1 ETH - CLEAR_REWARD_FOUR
    const redeemOfA6 = await future.userRedeemBalance(accounts[6]);
    const redeemOfA7 = await future.userRedeemBalance(accounts[7]);

    assert(redeemOfA6.eq(redeemOfA6Before), 'userRedeemBalance of account 6 is not changed');
    const expectedRedeemOfA7 = new BigNumber(10 ** 18).minus(clearReward).div(2).plus(10 ** 18);
    assert(redeemOfA7.eq(expectedRedeemOfA7), 'userRedeemBalance of account 7 is 1 ETH - CLEAR_REWARD_FOUR');

    const balanceOfBefore = [
      await web3.eth.getBalance(accounts[6]),
      await web3.eth.getBalance(accounts[7])
    ];
    // Using account 6 and 7, call the redeem function
    const redeemA6Tx = await future.redeem({
      from: accounts[6]
    });

    const redeemA7Tx = await future.redeem({
      from: accounts[7]
    });

    const balanceOfAfter = [
      await web3.eth.getBalance(accounts[6]),
      await web3.eth.getBalance(accounts[7])
    ];
    const actuallyRedeemOfA6 = balanceOfAfter[0].minus(balanceOfBefore[0]);
    const actuallyRedeemOfA7 = balanceOfAfter[1].minus(balanceOfBefore[1]);
    const gasOfA6GasUsed = redeemA6Tx.receipt.gasUsed;
    const gasOfA7GasUsed = redeemA7Tx.receipt.gasUsed;

    // Verify that account 6 and 7 have received the userRedeemBalance as calculated in the last step.
    assert(redeemOfA6.eq(actuallyRedeemOfA6.plus(gasOfA6GasUsed * 10 ** 9)));
    assert(redeemOfA7.eq(actuallyRedeemOfA7.plus(gasOfA7GasUsed * 10 ** 9)));

  });

  it("5. Invest both of long and short with new deploy", async () => {

    const {
      name,
      description,
      symbol,
      category,
      targetAddress,
      investingPeriod
    } = {
      name: 'Binary Future Stress Test Multi',
      description: 'A binary future stub contract to test stress cases with investments into multiple direction',
      symbol: 'BFSTM',
      category: '0x42696e617279467574757265537472657373',
      targetAddress: providers.mockMOT.address,
      investingPeriod: 60, // not important
    }

    const future = await BinaryFuture.new(
      name,
      description,
      symbol,
      category,
      targetAddress,
      investingPeriod,
    );

    //  2. Call the initialize function on the binary future with parameters
    //  'COMPONENT_LIST_ADDRESS' for the component list and
    //  '0' for the fee
    await future.initialize(providers.componentList.address, 0);

    const longAddress = await future.getLongToken();
    const shortAddress = await future.getShortToken();

    const longToken = new BinaryFutureToken(longAddress);
    const shortToken = new BinaryFutureToken(shortAddress);

    /******* investment, multiple directions ******/
    // Using account 0 , call setMockTargetPrice and set value to 1 ether (10**18)
    // Using account 0, call setMockPeriod and set the value to 2
    await future.setMockTargetPrice(1 * 10 ** 18);
    let period = 2;
    await future.setMockPeriod(period);

    // Save ETH balance of account 1-5 in a variable called ACCOUNT_ETH_BALANCES
    // Using accounts 1-5 invest into short position (5 transactions)
    // account 1: invest (1,2) (with value of 0.5* 10**18)
    // account 2: invest (1,2) (with value of 0.5* 10**18)
    // account 3: invest (1,2) (with value of 0.1* 10**18)
    // account 4: invest (1,2) (with value of 0.1* 10**18)
    // account 5: invest (1,2) (with value of 1* 10**18)

    const shortValues = [
      0.5 * 10 ** 18,
      0.5 * 10 ** 18,
      0.1 * 10 ** 18,
      0.1 * 10 ** 18,
      1 * 10 ** 18,
    ];

    let index = 1;
    while (index <= 5) {
      await future.invest(FutureDirection.Short, period, {
        from: accounts[index],
        value: shortValues[index - 1],
      })
      index++;
    }

    // Check that all the valid tokens exist and have the correct balance
    let shortTokenIds = await future.getTokensByPeriod(FutureDirection.Short, period);
    await Promise.all(shortTokenIds.map(async (id) => {
      const value = await shortToken.getDeposit(id);
      const exist = shortValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    }));

    // 5
    // Use the 5 accounts to invest in a different position.
    // account 1: invest (-1,2) (with value of 0.5* 10**18)
    // account 2: invest (-1,2) (with value of 1* 10**18)
    // account 3: invest (-1,2) (with value of 0.1* 10**18)
    // account 4: invest (-1,2) (with value of 0.05* 10**18)
    // account 5: invest (-1,2) (with value of 3* 10**18)

    const longValues = [
      0.5 * 10 ** 18,
      1 * 10 ** 18,
      0.1 * 10 ** 18,
      0.05 * 10 ** 18,
      3 * 10 ** 18,
    ];

    index = 1;
    while (index <= 5) {
      await future.invest(FutureDirection.Long, period, {
        from: accounts[index],
        value: longValues[index - 1],
      });
      index++;
    }

    // Check that all the valid tokens have been updated and have the correct balance
    let longTokenIds = await future.getTokensByPeriod(FutureDirection.Long, period);
    await Promise.all(longTokenIds.map(async (id) => {
      const value = await longToken.getDeposit(id);
      const exist = longValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    }));

    // 6
    // Invest again with some accounts: 
    // account 4: invest(-1,2) (with value of 0.051*10**18)
    // account 5: invest(-1,2) (with value of 10**18) 
    const invertOfA4 = 0.051 * 10 ** 18;
    longValues[3] += invertOfA4;
    await future.invest(FutureDirection.Long, period, {
      from: accounts[4],
      value: invertOfA4,
    });

    const invertOfA5 = 1 * 10 ** 18;
    longValues[4] += invertOfA5;
    await future.invest(FutureDirection.Long, period, {
      from: accounts[5],
      value: invertOfA5,
    });

    // Check that all the valid tokens have been updated and have the correct balance
    shortTokenIds = await future.getTokensByPeriod(FutureDirection.Short, period);
    await Promise.all(shortTokenIds.map(async (id) => {
      const value = await shortToken.getDeposit(id);
      const exist = shortValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    }));

    longTokenIds = await future.getTokensByPeriod(FutureDirection.Long, period);
    await Promise.all(longTokenIds.map(async (id) => {
      const value = await longToken.getDeposit(id);
      const exist = longValues.indexOf(+value);
      assert.isAbove(exist, -1, 'should found the value invested');
    }));

    /************** Binary Future 2, clear ***************** */
    // Using account 0 , call setMockTargetPrice and set value to 0.9 ether (0.9*10**18)
    // Using account 0, call setMockPeriod and set the value to 4
    await future.setMockTargetPrice(0.9 * 10 ** 18);
    await future.setMockPeriod(4);
    // Using account 1, call clear(2)
    const clearTx = await future.clear(period, {
      from: accounts[1]
    });

    const clearReward = utils.getClearRewardFromLogEvent(clearTx);

    const allLongValues = longValues.reduce((a, b) => new BigNumber(a).plus(b));
    const allShortValues = shortValues.reduce((a, b) => new BigNumber(a).plus(b));

    // short invest win. 
    const estimatedReward = await utils.estimateRewardAmountForBinaryFuture(future, allLongValues);
    assert.equal(+clearReward, +estimatedReward, 'clear reward should be equal estimated reward');

    /** ************* redeem ***************** */
    // Using accounts 1 through 5, call redeem. Get all ETH Balances in variable array ACCOUNT_ETH_BALANCES_NOW
    // expect calculate each account 1-5 actually redeem are equal shouldRedeem.
    index = 1;
    while (index <= 5) {
      const oldBalance = web3.eth.getBalance(accounts[index]);
      const redeemBalance = await future.userRedeemBalance(accounts[index]);
      const investValue = shortValues[index - 1];

      const percentage = new BigNumber(investValue).div(allShortValues);
      const shouldRedeem = allLongValues.minus(clearReward).times(percentage).plus(investValue);
      // string value for big number will not equal should compare with number;
      assert.equal(+shouldRedeem, +redeemBalance, 'expected redeem balance');
      await future.redeem({
        from: accounts[index]
      });
      const balance = web3.eth.getBalance(accounts[index]);
      assert(calc.inRange(+balance.minus(oldBalance), +redeemBalance, 10 ** 15),
        'expected redeemed balance near redeemBalance');
      index++;
    }

  });

})
