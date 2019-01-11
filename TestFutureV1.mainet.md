MockOracle: 0x1ec66ad4b0b14a0009971aad0432bddfa326661d
ComponentList: 0xb3c8d8713c1bfdefd2c8bed7594e1103da0e650a
StepProvider: 0xCC8447a301568E61e1aA79c5046F2e4B17753187

0xb5e7d298dd00f04e94f3495de7c4e31761daf67d

0xf03720af8665d143ae07199f8d8ba0277ca997a1
0x0500fb7c7f95eab5c06df396978f2487952246ef


# 1. New Future
Deploy: 
```
"FutureMTest","FutureV1","FV1","0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","1","0xb3c8d8713c1bfdefd2c8bed7594e1103da0e650a","2","1000","8000"
```

deployed: 0x107Ec3039E0D9Ba8c16434d9141a2fff3C477ccC
deployed: 0xb5e7d298dd00f04e94f3495de7c4e31761daf67d
deployed: 0xb9fdcbf2b2496a7496cc6f12b52f07339ae112d2



expect:
1. success deploy 0x70A2e25Ad3cac5Af473845CA1F336cE7E94b6683
2. Status: 0
3. name: FutureMTest
4. description: FutureV1
5. symbol: FV1
6. targetAddress: 0xB3C8D8713c1BFdeFd2c8BeD7594E1103Da0e650A
7. price(provider address): 0x507269636550726f766964657200000000000000000000000000000000000000
8. getAmountOfTargetPerShare: 2
9. fundType: 2
10. category: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000

# 2. Initialize
Initialize: 
"0xb3c8d8713c1bfdefd2c8bed7594e1103da0e650a","60"  value:0.11 ETH
** Call clear()

expect:
1. Status: 1
2. Clear reverts (do it before 60 seconds) Detailed
3. The Second initialize should reverts.
4. The future appears in the list of future. Use ComponentContainer to check the market address from the component list
5. Delivery date: 60
6. LongToken:  0xeC1CeB5f1E9E2b98E0216E5572B8256DF578a450
7. ShortToken: 0xE02E9F83746a397C7C38FD039F7226464FCBA89f

# 3. ** Withdraw Manager Fee
    ** getManagerFee
    expect:

# 4. get the real token price
    MockOracle address: 0x71cbC9Ff8C0C1978CcB3D79015757D8963C5bcAB
    Oracle address: 0x9A555F092dD910AC6dDedaC20307aB5bf8cc26B5
    Oracle address: 0xA325BAb253AD1f2D96ACC613CD1EF01d8af2E5b4 (can be call ComponentListService getLatestComponent())

expect:
1. Load ChainlinkInterface @ropsten deployed Oracle address on Readme file under the protocol project;
2. Under the ChainlinkInterface, call requestEthereumPrice 
    "587948181f6248dbbb8599f949f977c634343","USD"
    to get the real price from Oracle. Need to use the Olympus Owner address (0x1cD5Fcc6d1d3A2ECdd71473d2FCFE49769643CF2) to request otherwise it will be failed.
3. The timeout of real price is set to be 300 seconds. After 300 seconds, will need to request new price again in order to invest.

# 5. ** Calculate Deposit Value
expect:
 1) "1", "100000000000000000"     -> 20%
 2) "2", "100000000000000000"     -> 40%
 3) "0", "100000000000000000"     -> 0
 4) "-1", "100000000000000000"    -> 0
 5) "1", 0                        -> 0
 6) "1", "-1"                     -> 0
 7) "1", "950000000000000000"     -> 190000000000000000

# 6. Invest Long (-1)
 1) invest: We want to buy two tokens (calculate deposit) "2", "100000000000000000". 
(Or your current target price)
Get the amount of deposit required and double (800000000000000000) (here the point is that the money extra you invest need to be return it back. doesn't need to be exactly the double, thats just and example)
 2) With investor A address invest Long 2 shares ( -1, 2, 800000000000000000 )
 3) Calculate getTokenBottomPosition of long with the id of previous tokens. 

 price: 6707357971694949
 getTokenBottomPosition: -1, 1 -> 269887322043047

 expect:
 1) TX shall succeed
 2) require deposit (400000000000000000)
 3) Use Long token (contract: FutureERC721Token @ getLongToken address) getTokenIdsByOwner or getValidTokenIdsByOwner, must be 2
 4) ** Check previous tokens values are correct buying price, deposit (is half on each) tokens are valid
 5) @future.getTokenBottomPosition, each token shall be 20% of the total deposit (it is 80% of the value is lost)

# 7. Invest Short (1)
 1) invest: We want to buy two tokens (calculate deposit) "2", "40000000000000000". (Or the current default price)
 Get the amount of deposit required and double (80000000000000000) (double is just a number, important is that the exceeding price gets return)
 2) With investor B address invest Short 2 shares ( 1, 2, 80000000000000000 )
 3) Calculate getTokenBottom position of long and short with the id of previous tokens.
 
 expect:
 1) TX shall succeed
 2) require deposit (400000000000000000)
 3) Use Long token (contract: FutureERC721Token @ getLongToken address) getTokenIdsByOwner or getValidTokenIdsByOwner, must be 2
 4) ** Check previous tokens values are correct buying price, deposit (is half on each) tokens are valid
 5) @future.getTokenBottomPosition, each token shall be 20% of the total deposit (it is 80% of the value is lost)

# 8. ** Actual Value Long Lose
There are 4 scenarios:
1. Long lose, but he recovers some ETH
2. Long lost all
3. Short lose, but he recovers some ETH
4. Short lost all.
Obviously, when one is losing the other is winning.
NOTE: If the price is not the default one you can apply the percentage. But this must be according the number of assets and the deposit. If this number changes the formula changes.
NOTE: If deposit is 10% , and the price drops 1%, your actual deposit drops 10%
DEPOSIT - PRICE = ACTUAL
10% , -1%, ==> -10%
10%, -10% ==> -100%

1. getTokenActualValue for (-1, LongID1, 910000000000000000) 91% of current Price
2. getTokenActualValue for (-1, LongID1, 900000000000000000) 90% of current Price
3. getTokenActualValue for (1, ShortID1, 910000000000000000)  91% of current Price
4. getTokenActualValue for (1, ShortID1, 900000000000000000) 90% of current Price

expect:
1. result shall be 2E+16
2. result shall be 0
3. result shall be 3.75 E16
4. result shall be 4E16


# 9. ** Actual Value Short Lose
There are 4 scenarios: Long lose, but he recovers some ETH. Long lost all. Short lose, but he recovers some ETH,Short lost all. Obviously, when one is losing the other is winning.
NOTE: If the price is not the default one you can apply the percentage. But this must be according the number of assets and the deposit. If this number changes the formula changes.

1. getTokenActualValue for (-1, LongID1, 1090000000000000000)  10.9% of current price
2. getTokenActualValue for (-1, LongID1, 110000000000000000)   11% of current price
3. getTokenActualValue for (1, ShortID1, 1090000000000000000)  10.9% of current price
4. getTokenActualValue for (1, ShortID1, 110000000000000000)   11% of current price

expect:
1. result shall be 3.8E16
2. result shall be 4 E16
3. result shall be 2.08 E16
4. result shall be 0

# 10. Investor Assets Value
Difference between this and the previous scenario, here is the total assets and the price is the internal of the Future.

1. Make sure the price is 1e18. Get investorA and investorB getMyAssetValue
2. Make sure the price is 0.95e18. Get investorA and investorB getMyAssetValue
3. Make sure the price is 0.90e18. Get investorA and investorB getMyAssetValue
4. Make sure the price is 1.05e18. Get investorA and investorB getMyAssetValue
5. Make sure the price is 1.10e18. Get investorA and investorB getMyAssetValue

expect:
1. For A is 4 E17 Default price for B is 4E17
2. A 2E18, for B is 6E18(approx)
3. A 0E18, for B is 8E18 (approx)
4. A 6E18, for B is 2E18(approx)
5. A 8E18, for B is 0E18 (approx)

# 11. Check Position No one out
We are going to check also step provider in this step. If is not a detailed test you can skip this part and execute all in one tx.

0x5374657050726f7669646572(is "StepProvider");
call getComponentByName("0x5374657050726f7669646572") = 0xAC0b69aBd7C9BcC670441Ee4E4FAF00F9127f808 (can found on readme);

1. Set Time interval to check position to 180s  
    category: 0x436865636b506f736974696f6e ("CheckPosition")
2. ** setMaxSteps for checkPosition to 1
3. Set price as 910000000000000000 (Long Lose not all)
4. ** Check position 4 times, you can check the functionCall and stepStatus (If no change the step provider just once)
5. ** setStepProvider back to 5 (default)
6. Set price as 1.04, make sure the 180s passed. setCheckPosition timer to 0.
7. Check position again.

expect:
check on StepProvider contract component:
status params: current future contract address, category byte32 name;
currentFunctionStep params: current future contract address, category byte32 name;

1. ** First step status 1, current function 1. (Long checked 1)
2. ** Second step status 2, current function 0. (Long checked 2, and complete his phase, short will start)
3. ** Third step status 2 current function 1 (short checked the first)
4. ** Four step status 0, current function 0 (short finish and step finish— After both check positions you can
5. Check that there weren't any DepositReturn Event
6. ** check that the validTokens of long and short tokens are still 2.
7. No step shall fall because the locker, as we are inside the multiple step.

# 12. Check Position Long is out
When you are out, your deposit is lost more than 80%, are two scenarios - Your deposit is lost 100% or more, so you lose all - Your deposit is lost between 80% (or the chosen bottom position) and 100%, then you still get the remaining deposit.This test cases is based in the second case that covers more logic.

1. Set Time interval to check position to 60s.
2. Set Price as 0.91 (This number make deposit go under bottom position but without getting value 0)
3. call check position
   
expect:
1. Check there are two ReturnDeposit Events only for Long tokens
2. Check there are two ether transfers
3. ** Check that the two tokens ids are now invalidated.
4. ** Check that long token valid tokens all and by owner return 0 tokens.
5. Winner balance is equal to the deposits less the two previous transfers.

# 13. Check Position Short is out
1. Set Price as 1.01 (This number make deposit go under bottom position but without getting value 0)2. call check position

expect:
1. Check there are two ReturnDeposit Events only for Long tokens
2. Check there are two ether transfers
3. ** Check that the two tokens ids are now invalidated.
4. ** Check that long token valid tokens all and by owner return 0 tokens.
5. Winner balance is equal to the to the deposits less the two previous transfers (and the previous winner balance).

# 14. Check winners balance

There will be a big issue if the ETH for the investor is taken from the management fee, and that happen if any formula is wrong. This test case is based that in previous test cases all investor lose, we are into a ALL LOSE situation.

1. Get winnersBalance and getManagerFee.
2. Get total ETH balance from the contract address

expect:
1. Check winnersBalance + getManagerFee is equal to the total ETH balance.

# 15. Check Position Locker
Now all the tokens are invalid.

1. Set Time interval to check position to 60s.
2. Call to checkPosition
3. Call again to checkPosition
4. Set time interval to 0s and. call again to checkPosition.

expect:
1. Step 2 will pass and the timer will update. No event shall come (as there were not even valid tokens)
2. Step 3 shall revert because the locker.
3. Step 4 shall succeed because the locker passed. (and is reset to 0 so we can keep testing without waiting)

# 16. Clear Future Preparation
At the moment all our tokens are invalid, we will need new tokens to test on clear.
1. Set the price to 0.95 ETH 
2. Investor A buy 2 Long token and investor B buy 2 short token (give them enough deposit to get the token)
3. Set the price to 1.05 ETH
4. Investor A buy 2 Long token and investor B buy 2 short token (give them enough deposit to get the token)
5. Set the price to 1 ETH
   
expect:
1. Check longValid tokens and short valid tokens both are 4 .
2. ** check tokens by user A and B are 4.
3. ** check valid tokens by user A and B, are 2.
4. Detail , check the deposit of valid tokens and the start price and the owner.
Correspond wit the previously purchased.

# 17. Clear Future
We have a situation that the LONG token purchased at 1.05 ETH will be out of the game, and the SHORT token purchased to 0.95 will be also out of the game. So investor. A (Long) will have 2 token winner and another 2 loser. The same for investor B.

1. (Detailed) Set multiple step for clear to
2. (That will required 6 calls). (Fast, leave the default, will take 2 calls).
3. ** Call 4 times (fast) call 1 time
   
expect:
1. ** First call Clear position Status is 1 (LongTokens) and no Deposit returned (2 Long tokens at 0.95 are winners). Clear status is Losers (1)
2. ** Second call will return 2 Deposits (3er and 4th Long token)
3. ** Third call will return 2 short deposit, 4th call will return no deposit. Clear status is Winners (2)
4. (Fast) if you runner at once, you will have 4 deposits (half of the valid tokens)and status is Winners (2)
5. At this point check the validTokens by owner short and long, only 2 are remaining in each category.
6. Future status is closed. Check the winner balance is the deposits of the 4 tokens less the ETH returned.
7. ** call clear status 1 more time. 2 long tokens are released, so 2 Benefits events shall appear.
8. ** Call clear status last time, 2 short tokens are released. Clear status is 0.
9. (Fast) If you make fast test, in that last call 4 events of Benefits appear.10. Check the benefits is the two deposits of the tokens + half of the winner balance.

# 18. Future is closed

In the MVP, the future is one way go, so now is closed. (Eventually from the first call to clear is already closed)

1. Try to invest
2.Try to check position
3. Try to clear again.
4. Check that ETH balance of the contract page is exactly the same of the ETH fee
5. Try to redeem all the management fee.

expect:
1. Invest, check position and clear shall redeem.
2. All ETH shall be the same of management fee.
3. Manager can withdraw all the fee.
4. ETH is 0.
5. ** frozenTotalWinnersSupply winnersBalance, frozenPrice, winnersBalanceRedeemed all are 0.
6. getAllValidTokens of Long and Short is 0.



