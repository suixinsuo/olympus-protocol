const calc = require('../utils/calc');
const BigNumber = web3.BigNumber;

const {
  FutureDirection,
  DerivativeType
} = require('../utils/constants');
const futureUtils = require('./futureUtils');
const binaryUtils = require('./futureBinaryUtils');
const futureData = binaryUtils.binaryFutureStressData;

const BinaryFutureToken = artifacts.require('BinaryFutureERC721Token');
const DENOMINATOR = 10000;
const BinaryFuture = artifacts.require('BinaryFutureStub');


contract('Test Binary Future Stress', accounts => {

    let future;
    let providers;
  
    const investorA = accounts[1];
    const investorB = accounts[2];
    // Groups of investors
    const investorsLong = accounts.slice(2, 7);
    const investorsShort = accounts.slice(8, 13);
  
    let longToken;
    let shortToken;
    before('Initialize ComponentList', async () => {
      providers = await futureUtils.setUpComponentList();
    });

    it('Create a future', async () => {
        future = await BinaryFuture.new(
          futureData.name,
          futureData.description,
          futureData.symbol,
          futureData.category,
    
          providers.tokens[0],
          futureData.investingPeriod,
        ); // A token from Kyber
    
        assert.equal((await future.status()).toNumber(), 0); // new
    
        await future.initialize(providers.componentList.address, futureData.feePercentage);
        const myProducts = await providers.market.getOwnProducts();
    
        assert.equal(myProducts.length, 1);
        assert.equal(myProducts[0], future.address);
        assert.equal((await future.status()).toNumber(), 1); // Active
    
        // We have created two new ERC721, check the address is not 0
        const longAddress = await future.getLongToken();
        const shortAddress = await future.getShortToken();
    
        assert.ok(parseInt(longAddress) != 0, 'Long token is set');
        assert.ok(parseInt(shortAddress) != 0, 'Short token is set');
    
        longToken = new BinaryFutureToken(longAddress);
        shortToken = new BinaryFutureToken(shortAddress);
    
        assert.equal(await longToken.owner(), future.address);
        assert.equal((await longToken.tokenPosition()).toNumber(), FutureDirection.Long, 'Long token is long');
    
        assert.equal(await shortToken.owner(), future.address);
        assert.equal((await shortToken.tokenPosition()).toNumber(), FutureDirection.Short, 'Short token is short');
      });

      it('Cant call initialize twice ', async () => {
        await calc.assertReverts(async () => {
          await future.initialize(providers.componentList.address, futureData.feePercentage)
        }, 'Shall revert');
      });
    
      it('Future initialized correctly', async () => {
        assert.equal(await future.name(), futureData.name);
        assert.equal(await future.description(), futureData.description);
        assert.equal(await future.symbol(), futureData.symbol);
        assert.equal(calc.bytes32ToString(await future.category()), futureData.category);
        assert((await future.version()) !== '');
        assert.equal(await future.getTargetAddress(), providers.tokens[0]);
        assert.equal((await future.fundType()).toNumber(), DerivativeType.BinaryFuture);
      });

      it('Invest with different prices', async () => {

        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice));
        assert((await future.getTargetPrice()).eq(futureData.originTargetPrice));
        await future.setMockPeriod(2);

        //Invest Short In Different Price
        const weightsShort = [0.2, 0.05, 0.35,0.1,0.5]; 
        await future.invest(1, 2,{ from: investorsShort[0], value: (weightsShort[0])*10**18 });
        await future.invest(1, 2,{ from: investorsShort[1], value: (weightsShort[1])*10**18 });
        await future.invest(1, 2,{ from: investorsShort[2], value: (weightsShort[2])*10**18 });
        await future.invest(1, 2,{ from: investorsShort[3], value: (weightsShort[3])*10**18 });
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*0.5));
        await future.invest(1, 2,{ from: investorsShort[4], value: (weightsShort[4])*10**18 });
        for (let index = 0; index < investorsShort.length; index++){
           let tokensA = await shortToken.getTokenIdsByOwner(investorsShort[index]);
           assert.equal(tokensA.length, 1);
           assert.equal(await shortToken.isTokenValid(tokensA[0]), true, 'Token A is valid');
           assert((await shortToken.getDeposit(tokensA[0])).eq(new BigNumber((weightsShort[index]*10**18))), 'Token A deposit is correct');
           assert((await shortToken.getTokenPeriod(tokensA[0])).eq(2), 'Token A deposit is correct');            
        };

        //Invest Short In Different Price
        const weightsLong = [0.1, 0.025, 0.075,0.25,0.05]; 
        await future.invest(-1, 2,{ from: investorsLong[0], value: (weightsLong[0])*10**18 });
        await future.invest(-1, 2,{ from: investorsLong[1], value: (weightsLong[1])*10**18 });
        await future.invest(-1, 2,{ from: investorsLong[2], value: (weightsLong[2])*10**18 });
        await future.invest(-1, 2,{ from: investorsLong[3], value: (weightsLong[3])*10**18 });
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*1.2));
        await future.invest(-1, 2,{ from: investorsLong[4], value: (weightsLong[4])*10**18 });
        for (let index = 0; index < investorsLong.length; index++){
            let tokensB = await longToken.getTokenIdsByOwner(investorsLong[index]);
            assert.equal(tokensB.length, 1);
            assert((await longToken.getDeposit(tokensB[0])).eq(new BigNumber((weightsLong[index]*10**18))), 'Token B deposit is correct');
            assert((await longToken.getTokenPeriod(tokensB[0])).eq(2), 'Token B deposit is correct');            
         }; 
    });

      it('Clear stress', async () => {
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*0.5));
        await future.setMockPeriod(4);
        let LOST_ETHER;
        let CLEAR_PRE_ETH;
        let UserRedeemBalance;
        for (let index = 0; index < investorsLong.length; index++) {
            LOST_ETHER += web3.fromWei(await web3.eth.getBalance(investorsLong[index]).toNumber(),'ether');
        }

        CLEAR_PRE_ETH = web3.fromWei(await web3.eth.getBalance(investorsShort[0]).toNumber(),'ether');

        for (let index = 0; index < investorsShort.length; index++) {
            UserRedeemBalance += web3.fromWei(await future.userRedeemBalance(investorsShort[index]),'ether');
        }
        await console.log(await future.userRedeemBalance(investorsShort[0]));






    });




})