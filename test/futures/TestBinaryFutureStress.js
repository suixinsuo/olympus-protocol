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
  
    // Groups of investors
    const investorsA = accounts.slice(2, 7);
    const investorsB = accounts.slice(8, 13);
  
    let longToken;
    let shortToken;

    let LOST_ETHER;
    let CLEAR_PRE_ETH;
    let NON_CLEAR_ACCOUNT_BALANCES;
    let NON_CLEAR_ACCOUNT_BALANCES_NEW;
    let CLEAR_REWARD;
    let UserRedeemBalance;
    const weightsA = [0.2, 0.05, 0.35,0.1,0.5]; 
    const weightsB = [0.1, 0.025, 0.075,0.25,0.05]; 


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
        await future.invest(1, 2,{ from: investorsA[0], value: (weightsA[0])*10**18 });
        await future.invest(1, 2,{ from: investorsA[1], value: (weightsA[1])*10**18 });
        await future.invest(1, 2,{ from: investorsA[2], value: (weightsA[2])*10**18 });
        await future.invest(1, 2,{ from: investorsA[3], value: (weightsA[3])*10**18 });
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*0.5));
        await future.invest(1, 2,{ from: investorsA[4], value: (weightsA[4])*10**18 });
        for (let index = 0; index < investorsA.length; index++){
           let tokensA = await shortToken.getTokenIdsByOwner(investorsA[index]);
           assert.equal(tokensA.length, 1);
           assert.equal(await shortToken.isTokenValid(tokensA[0]), true, 'Token A is valid');
           assert((await shortToken.getDeposit(tokensA[0])).eq(new BigNumber((weightsA[index]*10**18))), 'Token A deposit is correct');
           assert((await shortToken.getTokenPeriod(tokensA[0])).eq(2), 'Token A deposit is correct');            
        };

        //Invest Short In Different Price

        await future.invest(-1, 2,{ from: investorsB[0], value: (weightsB[0])*10**18 });
        await future.invest(-1, 2,{ from: investorsB[1], value: (weightsB[1])*10**18 });
        await future.invest(-1, 2,{ from: investorsB[2], value: (weightsB[2])*10**18 });
        await future.invest(-1, 2,{ from: investorsB[3], value: (weightsB[3])*10**18 });
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*1.2));
        await future.invest(-1, 2,{ from: investorsB[4], value: (weightsB[4])*10**18 });
        for (let index = 0; index < investorsB.length; index++){
            let tokensB = await longToken.getTokenIdsByOwner(investorsB[index]);
            assert.equal(tokensB.length, 1);
            assert((await longToken.getDeposit(tokensB[0])).eq(new BigNumber((weightsB[index]*10**18))), 'Token B deposit is correct');
            assert((await longToken.getTokenPeriod(tokensB[0])).eq(2), 'Token B deposit is correct');            
         }; 
    });

      it('Clear stress', async () => {
        await future.setMockTargetPrice(new BigNumber(futureData.originTargetPrice*1.5));
        await future.setMockPeriod(4);
        assert.equal(await future.getCurrentPeriod(),4);
        for (let index = 0; index < investorsA.length; index++) {
          LOST_ETHER += await (await web3.eth.getBalance(investorsA[index])).toNumber();
          if(index!=0){NON_CLEAR_ACCOUNT_BALANCES += await (await web3.eth.getBalance(investorsA[index])).toNumber() };
        }

        CLEAR_PRE_ETH = (await web3.eth.getBalance(investorsA[0])).toNumber();

        for (let index = 0; index < investorsB.length; index++) {
          NON_CLEAR_ACCOUNT_BALANCES += await (await web3.eth.getBalance(investorsB[index])).toNumber();
        }
        await future.clear(2,{from:investorsA[0]});

        CLEAR_REWARD  = (await web3.eth.getBalance(investorsA[0])).toNumber() - CLEAR_PRE_ETH;
        

        for (let index = 0; index < investorsA.length; index++) {
          if(index!=0){NON_CLEAR_ACCOUNT_BALANCES_NEW += (await web3.eth.getBalance(investorsA[index])).toNumber() };
        }

        for (let index = 0; index < investorsB.length; index++) {
          NON_CLEAR_ACCOUNT_BALANCES_NEW += (await web3.eth.getBalance(investorsB[index])).toNumber();
        }

        //assert.ok(NON_CLEAR_ACCOUNT_BALANCES_NEW==NON_CLEAR_ACCOUNT_BALANCES,'Balances is no change.');
        assert.ok(CLEAR_REWARD>0,'The balance of account[1] should be greater');

      });

      it('Clear stress winner verification', async () => {
        
        for (let index = 0; index < investorsB.length; index++) {
          if(index!=0){
            let balancebefore = await (await web3.eth.getBalance(investorsB[index])).toNumber();
            await future.redeem({
              from: investorsB[index],
            });
            let balanceafter = await (await web3.eth.getBalance(investorsB[index])).toNumber();

            console.log(await(balanceafter - balancebefore + CLEAR_REWARD/5));
          }
        }

      });




})