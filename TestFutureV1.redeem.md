# As an investor, I want to request to redeem at any time.

The request can be done at any time, but the request will only be handled at next time for position check when check position, we know how much the investor has won or lost, then we can send him the funds that are left and recollect his tokens back.

The reason we need to do in checking position is that we have then the latest price to do the calculation. it will be like a temporary clear but only for the ones that request for redeeming.
By doing this, another function to estimate his winning or lost might be needed.

getValidTokenIdsByOwner(direction); return id with value array; (FutureERC721Token already have)
getBuyingPrice(tokenId);
getDeposit(tokenId);

# extra function 
estimateValue(direction, tokenId, price);
redeem(direction, tokenId);
redeemRequest(direction, tokenId);

## redeem before invest.
expect estimateValue return 0, before token invest (invalid token always return 0 estimated).

prepare condition
1. deploy a future contract. 
   "FutureTest","FutureV1","FV1","0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","1","0x4BFBa4a8F28755Cb2061c413459EE562c6B9c51b","2","1000","8000"
   deposit with 10%;
steps
1. estimateValue(1,1,100000000000000000) , should be return 0, estimateValue(-1,1,100000000000000000) , should be return 0;
2. initial contract, should be success;
   "0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e","60"  value:0.11 ETH
3. estimateValue(1,1,100000000000000000) , should be return 0, estimateValue(-1, 1, 100000000000000000) , should be return 0;
## estimateValue before check position.
1. set mock price 1 ETH.
2. account 1 invest( -1, 2), account 2 invest( 1, 2).
expect
- estimateValue(1, 1, 100000000000000000), should be return 0.2ETH, 
- estimateValue(-1, 1, 100000000000000000), should be return 0.2ETH
3. set price as 0.91 (Long will be out).
expect
- estimateValue(1, 1, 100000000000000000), should be return 0.2ETH;
- estimateValue(1, 1, 91000000000000000), should be return 0.4ETH;
- estimateValue(-1, 1, 100000000000000000), should be return 0 (long is out, token invalid);

## redeem before clear.
1. account 2 call redeem(1,[1]);
expect
- should be success;
- redeemToken[1] should be true;
2. call check position;
expect
- account 2 should be got 0.4ETH;
- estimateValue(1, 1, 100000000000000000), should be return 0;
- estimateValue(-1, 1, 100000000000000000), should be return 0;
- estimateValue(1, 2, 100000000000000000), should be return 0.4ETH;
- estimateValue(-1, 2, 100000000000000000), should be return 0;
1. account 2 call redeem(1,[2]);
2. call check position;
- account 2 should be got 0.4ETH;
- estimateValue(1, 1, 100000000000000000), should be return 0;
- estimateValue(1, 2, 100000000000000000), should be return 0;
## ** extra redeem before clear.
 Precondition
 set mock price 1 ETH.
1. account 1 invest( -1, 2), account 2 invest( 1, 2). 
expect
- valid tokenIds 5,6,7,8;
- estimateValue(-1, 5, 100000000000000000), should be return 0.2ETH;
- estimateValue(-1, 6, 100000000000000000), should be return 0.2ETH;
- estimateValue(1, 7, 100000000000000000), should be return 0.2ETH;
- estimateValue(1, 8, 100000000000000000), should be return 0.2ETH;
3. set price as 0.95;
expect
- estimateValue(-1, 5, 95000000000000000), should be return 0.1ETH; (if redeem then will lost half of invest)
- estimateValue(-1, 6, 95000000000000000), should be return 0.1ETH; (if redeem then will lost half of invest)
- estimateValue(1, 7, 95000000000000000), should be return 0.2ETH; (if redeem nobody will lost)
- estimateValue(1, 8, 95000000000000000), should be return 0.2ETH; (if redeem nobody will lost)
1. account 2 redeem(-1, [7,8]);
2. checkPosition();
- account 2 should be got 0.4ETH;
- estimateValue(-1, 5, 95000000000000000)
- estimateValue(-1, 6, 95000000000000000)
- estimateValue(1, 7, 95000000000000000)
- estimateValue(1, 8, 95000000000000000)
## redeem after clear.
prepare condition
1. deploy a future contract. 
   "FutureTest","FutureV1","FV1","0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","1","0x4BFBa4a8F28755Cb2061c413459EE562c6B9c51b","2","1000","8000"
   deposit with 10%;
2. initial contract, should be success;
   "0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e","60"  value:0.11 ETH
3. set mock price 1 ETH.
4. account 1 invest( -1, 2), account 2 invest( 1, 2);
5. set mock price 0.91 ETH.
6. call clear.
   
expect
estimateValue always return 0;
estimateValue(1, 1, 100000000000000000) return 0
estimateValue(-1, 1, 100000000000000000) return 0
estimateValue(1, 1, 110000000000000000) return 0
estimateValue(-1, 1, 90000000000000000) return 0
estimateValue(1, 2, 100000000000000000) return 0
estimateValue(-1, 2, 100000000000000000) return 0
estimateValue(-1, 2, 90000000000000000) return 0
estimateValue(1, 2, 110000000000000000) return 0